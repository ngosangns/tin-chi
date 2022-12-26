<script lang="ts">
	import data from '$lib/ts/data';
	import type { CalendarData, RawCalendar, CalendarGroupBySession } from '$lib/ts/calendar';
	import { processCalendar } from '$lib/ts/calendar';
	import SessionBar from './SessionBar.svelte';
	import { onMount } from 'svelte';

	type SelectedCalendar = {
		[subjectName: string]: {
			isChecked: boolean;
			class: {
				code: string;
				details: CalendarGroupBySession;
			} | null;
		};
	};

	const download_path = '/calendar-excel/2021-2022-2.xlsx';
	const title = 'Kì 2 Năm học 2021 - 2022';

	const defaultClassLabel = 'Chọn lớp';
	let triggerRerenderTable = false;

	let isOpenModel = false;
	let modalMessage = '';
	let modalBtn: any;

	const dayOfWeekMap = ['Chủ Nhật', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'];

	const openModel = (message: string) => {
		isOpenModel = true;
		modalMessage = message;
		modalBtn.click();
	};

	const closeModel = () => {
		isOpenModel = false;
	};

	const calendar: CalendarData = processCalendar(data as Array<RawCalendar>) || [],
		selectedCalendar: SelectedCalendar = {};
	const sessions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

	let calendarTableContent: any = (() => {
		const result: any = {};
		for (const date of calendar.dateList) {
			const dateKey = date;
			result[dateKey] = {};
			const resultDate = result[dateKey];
			for (const session of sessions) resultDate[session] = [];
		}
		return result;
	})();

	const checkSession = (shift: number) => {
		if (shift >= 1 && shift <= 6) return 'morning';
		if (shift >= 7 && shift <= 12) return 'afternoon';
		return 'evening';
	};

	const onChangeSelectSubjectClass = async (
		majorName: string,
		subjectName: string,
		selectClassEvent: EventTarget | null = null
	) => {
		const _subjectName = majorName + '---' + subjectName;
		const classCode: string = String(((selectClassEvent as any) || {}).value);

		(() => {
			// check subject
			{
				if (!selectedCalendar[_subjectName]) {
					selectedCalendar[_subjectName] = {
						isChecked: false,
						class: null
					};
				}
				if (!selectClassEvent) {
					selectedCalendar[_subjectName].isChecked = !selectedCalendar[_subjectName].isChecked;
					return;
				}
			}

			// check class
			{
				if (classCode == defaultClassLabel) {
					selectedCalendar[_subjectName].class = null;
					if (!selectedCalendar[_subjectName].isChecked) delete selectedCalendar[_subjectName];
					return;
				}
				selectedCalendar[_subjectName].class = {
					code: classCode,
					details: calendar.calendarGroupBySubjectName[subjectName].classes[classCode].details
				};
			}
		})();

		// skip rerender
		if (!selectClassEvent && !selectedCalendar[_subjectName].class) return;
		if (selectClassEvent && !selectedCalendar[_subjectName].isChecked) return;

		new Promise((resolve, reject) => {
			const worker = new Worker('/js/worker/calendar.js');
			worker.onmessage = (res: { data: any }) => resolve(res.data);
			worker.onerror = (err: any) => reject(err);
			worker.postMessage({
				type: 'calculateCalendarTableContent',
				data: {
					calendarTableContent,
					dateList: calendar.dateList,
					sessions,
					selectedCalendar
				}
			});
		})
			.then((result: any) => {
				if (result) {
					calendarTableContent = result.calendarTableContent;
					if (result.isConflict && !isOpenModel) openModel('Cảnh báo trùng lịch!');
				}

				if (isOpenModel) setTimeout(() => (triggerRerenderTable = !triggerRerenderTable), 150);
			})
			.catch((e) => {
				openModel('Có lỗi xảy ra, không thể cập nhật dữ liệu!');
			});
	};

	onMount(() => {
		const calendarModal = document.getElementById('my-modal-4-content');
		if (calendarModal) calendarModal.classList.remove('hidden');
	});
</script>

<label for="my-modal-4" class="btn mb-2">Chọn lớp</label>
<input type="checkbox" id="my-modal-4" class="modal-toggle" />
<label id="my-modal-4-content" for="my-modal-4" class="modal cursor-pointer hidden">
	<label class="modal-box w-9/12 max-w-3xl relative rounded-lg" for="">
		<label for="my-modal-4" class="btn btn-sm btn-circle sticky top-2 left-full z-10">✕</label>
		<div class="w-full">
			<div class="mb-8 w-full mx-auto">
				<p class="mb-2">Học kỳ: <b><h3 class="inline">{title}</h3></b></p>
				<p>Lưu ý:</p>
				<ul class="list-disc ml-4 mb-2" style="padding-left: .125rem">
					<li>Trang web chỉ hỗ trợ xếp lịch, không hỗ trợ đăng ký môn học trên web của trường.</li>
					<li>
						Các môn có tiết thực hành (có đuôi chấm theo sau) đã được thêm tiết lý thuyết vào.
					</li>
				</ul>
				<p>Hướng dẫn:</p>
				<ul class="list-disc ml-4 mb-2" style="padding-left: .125rem">
					<li>
						Check vào nút đăng ký các môn muốn học, sau đó chọn lớp cho từng môn, tiết nào bị trùng
						thì sẽ chuyển sang màu đỏ, bấm vào ô trong lịch để xem những môn của tiết đấy.
					</li>
					<li>
						Xem chi tiết thông tin của từng lớp trong file excel của trường, tải ở
						<!-- svelte-ignore security-anchor-rel-noreferrer -->
						<b><a href={download_path} target="_blank">đây</a></b>.
					</li>
				</ul>
				<p><b>Chúc các bạn đăng ký đúng lớp đã chọn ❤</b></p>
			</div>
			{#each Object.entries(calendar.calendarGroupByMajor).sort( (a, b) => a[0].localeCompare(b[0]) ) as [majorName, major]}
				<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
				<div
					class="collapse collapse-plus border border-base-300 bg-base-100 rounded-box w-full mx-auto mb-4"
				>
					<input type="checkbox" />
					<div class="collapse-title text-xl font-medium">
						<b><span>{majorName}</span></b>
					</div>
					<div class="collapse-content">
						<table class="table table-compact w-full">
							<!-- head -->
							<thead>
								<tr>
									<th class="text-center w-24">Đăng ký</th>
									<th>Tên môn</th>
									<th class="pl-5 w-40">Lớp</th>
								</tr>
							</thead>
							<tbody>
								{#each Object.entries(major.subjects) as [subject, subjectValue], subjectIndex}
									<tr>
										<th class="text-center w-24">
											<label>
												<input
													type="checkbox"
													class="checkbox"
													on:change={() => onChangeSelectSubjectClass(majorName, subject)}
												/>
											</label>
										</th>
										<td>
											<div class="flex items-center space-x-3">
												<span class="font-bold">{subject}</span>
											</div>
										</td>
										<td class="w-40">
											<select
												class="select select-bordered select-sm w-full max-w-xs"
												on:change={(e) => onChangeSelectSubjectClass(majorName, subject, e.target)}
											>
												<option selected>{defaultClassLabel}</option>
												{#each Object.entries(subjectValue.classes) as [code, codeValue]}
													<option>{code}</option>
												{/each}
											</select>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/each}
		</div>
	</label>
</label>

<div
	id="calendar-table-container"
	class="rounded-lg"
	style="overflow: scroll, overflow-x: hidden; overflow-y: overlay; max-height: 31rem"
>
	<table id="calendar-table" class="table table-compact w-full table-fixed">
		<tbody>
			{#key triggerRerenderTable}
				{#each calendar.dateList as date, dateIndex}
					{@const dateInstance = new Date(date)}
					{#if dateInstance.getDay() === 1}
						<SessionBar />
					{/if}
					<tr>
						<td colspan="2" class="text-xs text-center">
							<span class="font-bold text-lg">
								{dayOfWeekMap[dateInstance.getDay()]}
							</span><br />
							{dateInstance.toISOString().slice(0, 10).split('-').reverse().join('/')}
						</td>
						{#each sessions as session}
							{@const sessionContent = calendarTableContent[date][session]}
							<td
								class="px-2"
								class:bg-neutral={checkSession(session) == 'afternoon'}
								class:bg-neutral-focus={checkSession(session) == 'evening'}
							>
								{#if sessionContent.length}
									<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
									<div
										class="dropdown w-full"
										class:dropdown-end={['afternoon', 'evening'].includes(checkSession(session))}
										class:dropdown-top={dateIndex == calendar.dateList.length - 1}
									>
										<button
											tabindex="0"
											class="btn btn-primary btn-sm block w-full"
											class:btn-accent={sessionContent.length > 1}
										>
											{sessionContent.length == 1 ? '✓' : '✕'}
										</button>
										<div
											tabindex="0"
											class="dropdown-content menu p-4 mt-1 text-neutral text-neural-focus rounded-lg"
											class:bg-primary={sessionContent.length == 1}
											class:bg-accent-focus={sessionContent.length > 1}
										>
											{#each sessionContent as sessionContentDetail}
												<li class="text-lg" class:text-base-100={sessionContent.length > 1}>
													Môn: {sessionContentDetail.defaultName}
												</li>
											{/each}
										</div>
									</div>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			{/key}
		</tbody>
	</table>
</div>

<label bind:this={modalBtn} for="my-modal" class="btn hidden">Open modal</label>
<input type="checkbox" id="my-modal" class="modal-toggle" />
<div class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg text-center">{modalMessage}</h3>
		<div class="modal-action justify-center">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<label for="my-modal" class="btn" on:click={closeModel}>OK</label>
		</div>
	</div>
</div>

<style>
	#calendar-table-container::-webkit-scrollbar {
		width: 0.75rem;
	}

	#calendar-table-container::-webkit-scrollbar-track {
		background: transparent;
	}

	#calendar-table-container::-webkit-scrollbar-thumb {
		background: #d3d3d3;
		border-radius: 1rem;
	}

	#my-modal-4-content .modal-box::-webkit-scrollbar {
		width: 0.75rem;
	}

	#my-modal-4-content .modal-box::-webkit-scrollbar-track {
		background: transparent;
	}

	#my-modal-4-content .modal-box::-webkit-scrollbar-thumb {
		background: #d3d3d3;
		border-radius: 2rem;
	}
</style>
