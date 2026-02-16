// ... Firebase Config ...

async function updateRequest(id) {
    const { value: formValues } = await Swal.fire({
        title: 'تحديث الحالة',
        html: `
            <input id="stg" class="swal2-input" placeholder="اسم المرحلة">
            <textarea id="comm" class="swal2-textarea" placeholder="التعليق"></textarea>
            <label><input type="checkbox" id="isFin"> إغلاق نهائي بالقرار؟</label>`,
        focusConfirm: false
    });

    if (formValues) {
        const isFin = document.getElementById('isFin').checked;
        await db.collection("Requests").doc(id).update({
            status: isFin ? "تم الحل" : document.getElementById('stg').value,
            tracking: firebase.firestore.FieldValue.arrayUnion({
                stage: document.getElementById('stg').value,
                comment: document.getElementById('comm').value,
                date: new Date().toLocaleString('ar-EG'),
                isFinal: isFin
            })
        });
    }
}
