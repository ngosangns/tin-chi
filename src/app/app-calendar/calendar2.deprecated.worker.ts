import * as tf from '@tensorflow/tfjs';
import { MAX_SESSION, MIN_SESSION } from '../../constants/calendar';
import { AutoMode } from '../../types/calendar';
import { ClassData, Field, JSONResultData, Schedules } from '../../types/excel';
import { numToDate } from '../../utils/date';

const aDayInMs = 24 * 60 * 60 * 1000;
const aWeekInMs = aDayInMs * 7;

export type CalendarWorkerResponse = {
  data: { selectedClasses: [string, string, string][] };
};

export async function generateCombinationOfSubjects(e: {
  calendar: JSONResultData;
  selectedSubjects: [string, string][];
  auto: AutoMode;
  autoTh: number;
}): Promise<{ selectedClasses: [string, string, string][] }> {
  await tf.setBackend('webgl');

  const { calendar, selectedSubjects, autoTh } = e;

  // Size: [string, string, string][numClasses][numSubjects]
  const classesInfo: [string, string, string][][] = [];

  // Size: [startDate, endDate, dayOfWeek, bitmask][numSchedules][numClasses][numSubjects]
  const classesSchedules: [number, number, number, number][][][] = [];

  selectedSubjects.forEach(([majorKey, subjectKey]) => {
    const subjectData = calendar.majors[majorKey][subjectKey];
    const subjectInfo: [string, string, string][] = [];
    const subjectSchedules: [number, number, number, number][][] = [];
    Object.entries(subjectData).forEach(
      ([classCode, data]: [string, ClassData]) => {
        subjectInfo.push([majorKey, subjectKey, classCode] as [
          string,
          string,
          string
        ]);
        subjectSchedules.push(processSchedules(data.schedules));
      }
    );

    classesInfo.push(subjectInfo);
    classesSchedules.push(subjectSchedules);
  });

  const limits = classesSchedules.map((classes) => classes.length - 1);

  return tf.tidy(() => {
    const combinations = generateCombinations(limits);

    const overlaps = calculateOverlapsGPU(combinations, classesSchedules);

    console.log(overlaps);
    throw new Error('test');

    const bestComboIndex = autoTh % combinations.shape[0];

    const sortedIndices = tf.tidy(
      () => tf.topk(overlaps, overlaps.size).indices
    );
    const bestIndices = combinations
      .gather(sortedIndices.slice(bestComboIndex, 1))
      .arraySync()[0];

    if (!bestIndices?.length) return { data: { selectedClasses: [] } };

    return {
      selectedClasses: bestIndices.map((idx, i) => classesData[i][idx].info),
    };
  }) as { selectedClasses: [string, string, string][] };
}

function generateCombinations(limits: number[]): tf.Tensor2D {
  return tf.tidy(() => {
    const total = limits.reduce((a, v) => a * (v + 1), 1);
    const range = tf.range(0, total, 1, 'int32');
    const divisors = limits.map((_, i) =>
      limits.slice(i + 1).reduce((a, v) => a * (v + 1), 1)
    );

    return tf.stack(
      divisors.map((d, i) =>
        tf.mod(
          tf.floorDiv(range, tf.scalar(d, 'int32')),
          tf.scalar(limits[i] + 1, 'int32')
        )
      ),
      1
    ) as tf.Tensor2D;
  });
}

function calculateOverlapsGPU(
  combinations: tf.Tensor2D,
  classesData: [number, number, number, number][][][]
): tf.Tensor1D {
  return tf.tidy(() => {
    const maxClasses = Math.max(
      ...classesData.map((classes) => classes.length)
    );
    const maxSchedules = Math.max(
      ...classesData.map((classes) =>
        Math.max(...classes.map((schedules) => schedules.length))
      )
    );

    const paddedClassesData = classesData.map((classes) => {
      return classes
        .concat(
          Array.from({ length: maxClasses - classes.length })
            .fill(null)
            .map(() => [])
        )
        .map((schedules) => {
          return schedules.concat(
            Array.from({ length: maxSchedules - schedules.length })
              .fill(null)
              .map(() => [0, 0, 0, 0])
          );
        });
    });
    const subjectMatrices = tf.tensor4d(paddedClassesData);

    // Get indices for all pairs of classes
    const numSubjects = classesData.length;

    const i = tf.range(0, numSubjects - 1, 1, 'int32');
    const j = tf.range(1, numSubjects, 1, 'int32');

    // split combinations into chunks with size is 20000
    const chunkSize = 20000;
    const numCombinations = combinations.shape[0];
    const numChunks = Math.ceil(numCombinations / chunkSize);

    const chunkedCombinations = Array.from({ length: numChunks }).map(
      (_, i) => {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, numCombinations);
        return combinations.slice([start, 0], [end - start, -1]);
      }
    );

    const overlaps = [];
    for (const chunk of chunkedCombinations) {
      // Gather class indices for each combination
      const classIndices1 = tf.gather(chunk, i, 1);
      const classIndices2 = tf.gather(chunk, j, 1);

      // Get schedules for selected classes
      const selectedSchedules1 = subjectMatrices.gather(classIndices1);
      const selectedSchedules2 = subjectMatrices.gather(classIndices2);

      // Split schedule components
      const [start1, end1, day1, mask1] = tf.split(selectedSchedules1, 4, -1);
      const [start2, end2, day2, mask2] = tf.split(selectedSchedules2, 4, -1);

      // Filter out schedules with start1 or start2 equal to 0
      const validSchedules = tf.logicalAnd(
        tf.notEqual(start1, tf.scalar(0, 'int32')),
        tf.notEqual(start2, tf.scalar(0, 'int32'))
      );

      const hasOverlap = tf.logicalAnd(
        tf.lessEqual(start1, end2),
        tf.greaterEqual(end1, start2)
      );
      const dayMatch = tf.equal(day1, day2);
      const bitmaskOverlap = tf.bitwiseAnd(mask1.toInt(), mask2.toInt());

      const totalWeeks = tf.ceil(
        tf.div(
          tf.sub(tf.minimum(end1, end2), tf.maximum(start1, start2)),
          tf.scalar(aWeekInMs)
        )
      );

      let bitmaskOverlapShifted = bitmaskOverlap;
      const bitCounts = [];

      for (let i = MIN_SESSION; i <= MAX_SESSION; i++) {
        bitCounts.push(
          tf.bitwiseAnd(
            bitmaskOverlapShifted,
            tf.fill(bitmaskOverlap.shape, 1, 'int32')
          )
        );
        bitmaskOverlapShifted = tf.floorDiv(bitmaskOverlapShifted, 2);
      }

      const totalBitCounts = tf.addN(bitCounts);

      // Calculate total overlap
      const pairOverlaps = tf.mul(
        tf.mul(
          tf.mul(tf.cast(hasOverlap, 'int32'), tf.cast(dayMatch, 'int32')),
          tf.mul(totalWeeks, tf.cast(validSchedules, 'int32'))
        ),
        totalBitCounts
      );

      const summedPairOverlaps = tf.sum(pairOverlaps, [1, 2, 3, 4]);
      overlaps.push(summedPairOverlaps);
    }

    return tf.concat(overlaps);
  });
}

function processSchedules(
  schedules: Schedules
): [number, number, number, number][] {
  return schedules.map((schedule) => [
    numToDate(schedule[Field.StartDate]).getTime(),
    numToDate(schedule[Field.EndDate]).getTime() + aDayInMs - 1,
    schedule[Field.DayOfWeekStandard],
    generateBitmask(
      schedule[Field.StartSession],
      schedule[Field.EndSession],
      MIN_SESSION,
      MAX_SESSION
    ),
  ]);
}

function generateBitmask(
  start: number,
  end: number,
  min: number,
  max: number
): number {
  return ((1 << (end - start + 1)) - 1) << (max - min + 1 - end);
}

function countBits(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

self.onmessage = async (e) =>
  self.postMessage(await generateCombinationOfSubjects(e.data));
