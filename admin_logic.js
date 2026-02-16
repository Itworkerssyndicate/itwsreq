// عند تحديث الحالة من لوحة الإدارة
async function updateStatus(docId) {
    const isClosing = document.getElementById('close-check').checked;
    const update = {
        status: isClosing ? "مغلق" : document.getElementById('new-stage').value,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: document.getElementById('new-stage').value,
            comment: document.getElementById('admin-comment').value,
            date: new Date().toLocaleString('ar-EG'),
            isFinal: isClosing // لحفظه كقرار نهائي
        })
    };
    await db.collection("Requests").doc(docId).update(update);
}
