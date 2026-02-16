// تهيئة Firebase (تأكد من مطابقة الإعدادات لمشروعك)
const firebaseConfig = {
    apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE",
    authDomain: "itwsreq.firebaseapp.com",
    projectId: "itwsreq",
    storageBucket: "itwsreq.firebasestorage.app",
    messagingSenderId: "417900842360",
    appId: "1:417900842360:web:83d9310f36fef5bbbe4c8d"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// التحقق من صلاحية الجلسة (Login Guard)
const role = sessionStorage.getItem("role");
if (!role) {
    window.location.href = "index.html";
}

/**
 * وظيفة تحميل البيانات وعرضها في الجدول
 * @param {string} type - 'complaint' أو 'suggestion'
 */
function loadData(type) {
    // تحديث الواجهة
    document.getElementById('content-box').style.display = 'block';
    document.getElementById('settings-box').style.display = 'none';
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('nav-' + type).classList.add('active');
    document.getElementById('view-title').innerText = type === 'complaint' ? "إدارة الشكاوى الواردة" : "المقترحات والأفكار";

    // جلب البيانات لحظياً من Firestore
    db.collection("Requests").where("type", "==", type).onSnapshot(snap => {
        let html = "";
        snap.forEach(doc => {
            const d = doc.data();
            html += `
                <tr>
                    <td style="color:#0ea5e9; font-weight:bold;">${d.refId}</td>
                    <td>${d.name || d.fullName}</td>
                    <td>${d.gov || d.governorate}</td>
                    <td>
                        <span style="background:${d.status === 'تم' ? '#064e3b' : '#1e3a8a'}; color:white; padding:4px 10px; border-radius:20px; font-size:0.8rem;">
                            ${d.status}
                        </span>
                    </td>
                    <td>
                        <button class="btn-view" onclick="openCard('${doc.id}', '${type}')">إدارة</button>
                        ${role === 'super' ? `<button class="btn-del" onclick="deleteDoc('${doc.id}')"><i class="fas fa-trash"></i></button>` : ''}
                    </td>
                </tr>`;
        });
        document.getElementById('tbody').innerHTML = html;
    });
}

/**
 * وظيفة فتح كارت التفاصيل والتحكم في المراحل
 */
async function openCard(id, type) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();

    if (type === 'suggestion') {
        // إذا كان اقتراحاً، يتم وضع علامة "تمت القراءة" تلقائياً
        if (d.status !== 'تمت القراءة') {
            await db.collection("Requests").doc(id).update({ status: "تمت القراءة" });
        }
        return Swal.fire({
            title: 'تفاصيل الاقتراح',
            background: '#1e293b',
            color: '#fff',
            html: `
                <div style="text-align:right; line-height:1.6">
                    <p><b>صاحب الاقتراح:</b> ${d.name}</p>
                    <p><b>المحافظة:</b> ${d.gov}</p>
                    <hr style="border-color:#334155">
                    <p><b>نص الاقتراح:</b><br>${d.details}</p>
                </div>`
        });
    }

    // إذا كانت شكوى، يظهر الكارت الكامل مع التراك سيستم
    const { value: form } = await Swal.fire({
        title: 'إدارة طلب العضو',
        background: '#1e293b',
        color: '#fff',
        width: '650px',
        html: `
            <div style="text-align:right; font-size:0.85rem; background:rgba(0,0,0,0.4); padding:15px; border-radius:12px; border:1px solid #0ea5e9; margin-bottom:15px;">
                <p><b>الاسم:</b> ${d.name} | <b>الرقم القومي:</b> ${d.nationalId}</p>
                <p><b>التليفون:</b> ${d.phone} | <b>المحافظة:</b> ${d.gov}</p>
                <p><b>المهنة:</b> ${d.job} | <b>العنوان:</b> ${d.address}</p>
                <hr style="border:0; border-top:1px solid #334155">
                <p><b>موضوع الشكوى:</b><br>${d.details}</p>
            </div>
            <input id="sw-stage" class="swal2-input" style="font-family:Cairo;" placeholder="المرحلة القادمة (مثل: المراجعة الفنية)">
            <textarea id="sw-comm" class="swal2-textarea" style="font-family:Cairo;" placeholder="اكتب تعليقاً لإغلاق المرحلة السابقة.."></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: 'تحديث المرحلة',
        cancelButtonText: 'إغلاق الطلب نهائياً (تم)',
        confirmButtonColor: '#0ea5e9',
        cancelButtonColor: '#10b981'
    });

    if (form) {
        const stage = document.getElementById('sw-stage').value;
        const comment = document.getElementById('sw-comm').value;
        if (!stage) return;

        await db.collection("Requests").doc(id).update({
            status: stage,
            tracking: firebase.firestore.FieldValue.arrayUnion({
                stage: stage,
                comment: comment || "تحديث إداري",
                date: new Date().toLocaleString('ar-EG')
            })
        });
    } else if (Swal.dismissReason === 'cancel') {
        // عند الضغط على "إغلاق الطلب نهائياً"
        await db.collection("Requests").doc(id).update({
            status: "تم",
            tracking: firebase.firestore.FieldValue.arrayUnion({
                stage: "تم",
                comment: "تمت المعالجة النهائية وإغلاق الملف",
                date: new Date().toLocaleString('ar-EG')
            })
        });
    }
}

/**
 * وظيفة حذف الطلب بكلمة سر
 */
async function deleteDoc(id) {
    const { value: pass } = await Swal.fire({
        title: 'تأكيد الحذف النهائي',
        text: 'يرجى إدخال كلمة سر الحذف للمتابعة',
        input: 'password',
        background: '#1e293b',
        color: '#fff',
        inputAttributes: { autocapitalize: 'off', autocorrect: 'off' }
    });

    if (pass === '11111@') {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("تم الحذف", "تم مسح بيانات الطلب من السجلات", "success");
    } else if (pass) {
        Swal.fire("خطأ", "كلمة السر غير صحيحة", "error");
    }
}

/**
 * عرض وإدارة إعدادات النظام
 */
function showSettings() {
    document.getElementById('content-box').style.display = 'none';
    document.getElementById('settings-box').style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('nav-settings').classList.add('active');

    db.collection("SystemSettings").doc("mainConfig").get().then(doc => {
        if (doc.exists) {
            const d = doc.data();
            document.getElementById('set-name').value = d.unionName || "";
            document.getElementById('set-pres').value = d.presidentName || "";
            document.getElementById('set-logo').value = d.logoURL || "";
            document.getElementById('set-url').value = d.servicesURL || "";
        }
    });
}

/**
 * حفظ الإعدادات في Firestore
 */
async function saveSettings() {
    try {
        await db.collection("SystemSettings").doc("mainConfig").set({
            unionName: document.getElementById('set-name').value,
            presidentName: document.getElementById('set-pres').value,
            logoURL: document.getElementById('set-logo').value,
            servicesURL: document.getElementById('set-url').value
        }, { merge: true });
        Swal.fire("تم الحفظ", "تم تحديث هوية النظام بنجاح", "success");
    } catch (e) {
        Swal.fire("خطأ", "فشل في حفظ الإعدادات", "error");
    }
}

// البدء بتحميل الشكاوى كافتراضي
loadData('complaint');
