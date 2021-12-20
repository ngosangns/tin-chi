// group subject code
let subject_tree = {};
for (let i = 0; i < mon.length; i++) {
    if (!subject_tree[mon[i][0]]) {
        subject_tree[mon[i][0]] = [mon[i]];
    } else {
        subject_tree[mon[i][0]].push(mon[i]);
    }
}

// add theory class to practice class
for (const [key, value] of Object.entries(subject_tree)) {
    let name = key.replace(/\((.+?)\)$/i, "");
    let is_practice_class = key.match(/\((.+?)\.\d{1,}\)$/i);
    if (is_practice_class) {
        let theory_code = is_practice_class[1];
        let theory_class = subject_tree[name + `(${theory_code})`];
        if (theory_class) {
            subject_tree[key].unshift(...JSON.parse(JSON.stringify(theory_class)));
            for (let i = 0; i < subject_tree[key].length; i++) {
                subject_tree[key][i][0] = key; // update subject name
            }
        }
    }
}

// remove theory class
for (const [key, value] of Object.entries(subject_tree)) {
    let name = key.replace(/\((.+?)\)$/i, "");
    let is_practice_class = key.match(/\((.+?)\.\d{1,}\)$/i);
    if (is_practice_class) {
        let theory_code = is_practice_class[1];
        if (subject_tree[name + `(${theory_code})`])
            delete subject_tree[name + `(${theory_code})`];
    }
}

let mon = [];
for (const [key, value] of Object.entries(subject_tree)) {
    mon.push(...subject_tree[key]);
}