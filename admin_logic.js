const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const role = sessionStorage.getItem("role");

function loadData(type) {
    // تبديل الألوان في الناف بار
    document.getElementById('btn-comp').classList.toggle('active', type=='شكوى');
    document.getElementById('btn-sug').classList.toggle('active', type=='اقتراح');
    document.getElementById('v-title').innerText = "سجل " + (type=='شكوى'?'الشكاوى':'المقترحات');

    // جلب البيانات مع الترتيب (تم إزالة orderBy مؤقتاً لضمان الظهور إذا لم يتم عمل Index)
    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        let docs = [];
        snap.forEach(d => docs.push({id: d.id, ...d.data()}));
        
        // الترتيب اليدوي بالأحدث لضمان عمل الكود فوراً
        docs.sort((a,b) => b.createdAt.seconds - a.createdAt.seconds);

        let h = "";
        docs.forEach(d => {
            h += `<tr>
                <td>${d.refId}</td><td>${d.name}</td><td>${d.nationalId}</td><td>${d.timestamp}</td>
                <td><b style="color:#00d2ff">${d.status}</b></td>
                <td><button class="main-btn" onclick="openCard('${d.id}')" style="padding:5px 10px; font-size:12px;">فتح</button></td></tr>`;
        });
        document.getElementById('tbody').innerHTML = h || "<tr><td colspan='6'>لا يوجد بيانات</td></tr>";
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    let history = d.tracking.map(t => `<div class="log-card"><b>${t.stage}</b>${t.comment}<br><small>${t.date}</small></div>`).reverse().join('');

    Swal.fire({
        title: 'تحديث حالة الطلب',
        background: '#0a1120', color: '#fff', width: '90%',
        html: `
            <div style="text-align:right; font-size:13px;">
                <p><b>مقدم الطلب:</b> ${d.name}</p>
                <p><b>التفاصيل:</b> ${d.details}</p>
                <hr style="opacity:0.2; margin:10px 0;">
                <label>اسم المرحلة التالية (أدخل التسمية التي تريدها):</label>
                <input id="new-stage" class="swal2-input" style="color:#000;" placeholder="مثال: جاري الفحص الفني">
                <label>الرد الإداري على هذه المرحلة:</label>
                <textarea id="admin-rep" class="swal2-textarea" style="color:#000; height:60px;" placeholder="اكتب ردك هنا"></textarea>
                <button onclick="closeRequest('${id}')" style="background:#e11d48; color:#fff; border:none; padding:10px; width:100%; border-radius:5px; margin-top:5px; cursor:pointer;">إغلاق الشكوى نهائياً (تم الحل)</button>
                <p style="margin-top:10px; color:#00d2ff;">السجل السابق:</p>
                <div style="max-height:120px; overflow-y:auto;">${history}</div>
            </div>`,
        confirmButtonText: 'تحديث الآن'
    }).then(r => {
        const stage = document.getElementById('new-stage').value;
        const comment = document.getElementById('admin-rep').value;
        if(r.isConfirmed && stage) updateStep(id, stage, comment);
    });
}

async function closeRequest(id) {
    Swal.close();
    updateStep(id, "تم الحل", "تمت معالجة شكواكم وإغلاق الملف.");
}

async function updateStep(id, stage, comment) {
    await db.collection("Requests").doc(id).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: stage, comment: comment || "تحديث إداري", date: new Date().toLocaleString('ar-EG')
        })
    });
    Swal.fire("تم التحديث","","success");
}

loadData('شكوى'); // تحميل الشكاوى تلقائياً عند الفتح
