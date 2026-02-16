// إعدادات الاتصال بقاعدة البيانات
const firebaseConfig = { 
    apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", 
    projectId: "itwsreq" 
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// 1. جلب إعدادات المنظومة (النقيب واللوجو والرابط)
db.collection("SystemSettings").doc("mainConfig").onSnapshot(doc => {
    if(doc.exists) {
        const data = doc.data();
        document.getElementById("pres-display").innerText = data.presidentName || "غير محدد";
        document.getElementById("main-logo").src = data.logoUrl || "logo.png";
        
        const svcBtn = document.getElementById("svc-link");
        if(svcBtn) {
            svcBtn.onclick = () => window.open(data.servicesLink || "#", '_blank');
        }
    }
});

// 2. التحكم في إظهار وإخفاء التبويبات (Tabs)
function showTab(t) {
    // إخفاء الكل
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    // إظهار التبويب المختار
    const target = document.getElementById('tab-' + t);
    if(target) {
        target.classList.add('active');
        target.style.display = 'block';
    }

    // تحديث شكل الأزرار
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('t-' + t);
    if(activeBtn) activeBtn.classList.add('active');
}

// 3. منطق العضوية (تبديل الخانات بناءً على النوع)
function toggleMemberFields() {
    const type = document.getElementById('u-member-type').value;
    const mIdInput = document.getElementById('u-m-id');
    const typeSelect = document.getElementById('u-type');
    
    if (type === "غير عضو") {
        mIdInput.style.display = 'none';
        mIdInput.value = ""; // تفريغ القيمة
        typeSelect.value = "اقتراح"; // إجبار غير العضو على اقتراح فقط
        typeSelect.disabled = true;
    } else {
        mIdInput.style.display = 'block';
        typeSelect.disabled = false;
    }
}

// 4. إرسال الطلب وحفظ البيانات
async function submitRequest() {
    // تجميع البيانات من المدخلات
    const name = document.getElementById('u-name').value.trim();
    const nid = document.getElementById('u-nid').value.trim();
    const phone = document.getElementById('u-phone').value.trim();
    const isMember = document.getElementById('u-member-type').value;
    const memberId = document.getElementById('u-m-id').value || "غير متوفر";
    const job = document.getElementById('u-job').value || "غير محدد";
    const gov = document.getElementById('u-gov').value || "غير محدد";
    const address = document.getElementById('u-address').value || "غير محدد";
    const type = document.getElementById('u-type').value;
    const details = document.getElementById('u-details').value.trim();

    // التحقق من صحة البيانات الأساسية
    if (!name || nid.length !== 14 || !phone || !details) {
        return Swal.fire({
            icon: 'error',
            title: 'بيانات ناقصة',
            text: 'يرجى كتابة الاسم الرباعي، الرقم القومي (14 رقم)، الهاتف، وتفاصيل الطلب.',
            background: '#0f172a',
            color: '#fff'
        });
    }

    // إنشاء كود الطلب والوقت
    const now = new Date();
    const refId = `${now.getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = firebase.firestore.Timestamp.now();

    const requestData = {
        name,
        nationalId: nid,
        phone,
        isMember,
        memberId,
        job,
        gov,
        address,
        type,
        details,
        status: "تم الاستلام",
        refId,
        createdAt: timestamp,
        tracking: [{
            stage: "تم الاستلام",
            comment: "تم استلام طلبكم بنجاح عبر البوابة الرقمية وجاري تحويله للإدارة المختصة.",
            date: now.toLocaleString('ar-EG')
        }]
    };

    try {
        await db.collection("Requests").add(requestData);
        Swal.fire({
            icon: 'success',
            title: 'تم الإرسال بنجاح',
            html: `كود الطلب الخاص بك هو: <b style="color:#00d2ff">${refId}</b><br>يرجى الاحتفاظ بالكود للاستعلام لاحقاً.`,
            background: '#0f172a',
            color: '#fff',
            confirmButtonColor: '#3a7bd5'
        });
        // إعادة تعيين النموذج
        document.getElementById('u-details').value = "";
        document.getElementById('u-name').value = "";
    } catch (error) {
        console.error("Error submitting:", error);
        Swal.fire('خطأ', 'حدثت مشكلة أثناء الإرسال، حاول مرة أخرى.', 'error');
    }
}

// 5. الاستعلام عن طلب (البحث الذكي)
async function searchRequest() {
    const sNid = document.getElementById('s-nid').value;
    const sRef = document.getElementById('s-ref').value;
    const resDiv = document.getElementById('track-res');

    if (!sNid || !sRef) {
        return Swal.fire('تنبيه', 'يرجى إدخال الرقم القومي ورقم الطلب معاً.', 'info');
    }

    try {
        const snap = await db.collection("Requests")
            .where("nationalId", "==", sNid)
            .where("refId", "==", sRef)
            .get();

        if (snap.empty) {
            resDiv.innerHTML = "";
            return Swal.fire('عذراً', 'لم يتم العثور على طلب بهذه البيانات.', 'warning');
        }

        const d = snap.docs[0].data();
        const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل والإغلاق"];
        const currentIdx = stages.indexOf(d.status) !== -1 ? stages.indexOf(d.status) : 1;

        // رسم كارت النتيجة مع التراك سيستم المائي
        resDiv.innerHTML = `
            <div class="info-card animate__animated animate__fadeInUp">
                <h3 style="color: #00d2ff; margin-bottom: 15px;">حالة الطلب: ${d.status}</h3>
                <div class="info-row">
                    <div class="info-item"><label>الاسم</label><p>${d.name}</p></div>
                    <div class="info-item"><label>النوع</label><p>${d.type}</p></div>
                </div>

                <div class="water-track">
                    <div class="track-line">
                        <div class="track-fill" style="width: ${(currentIdx / 3) * 100}%"></div>
                    </div>
                    ${stages.map((s, i) => `
                        <div class="track-node ${i <= currentIdx ? 'done' : ''}" style="right: ${(i / 3) * 100}%">
                            <span>${s}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="timeline-view" style="margin-top: 50px;">
                    <h4 style="border-bottom: 1px solid #1e293b; padding-bottom: 5px;">المسار الزمني:</h4>
                    ${d.tracking.map(t => `
                        <div class="log-box" style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; margin-top: 10px; border-right: 3px solid #00d2ff;">
                            <small style="color: #94a3b8;">${t.date}</small>
                            <p><b>${t.stage}:</b> ${t.comment}</p>
                        </div>
                    `).reverse().join('')}
                </div>
            </div>`;

    } catch (error) {
        console.error("Search Error:", error);
        Swal.fire('خطأ', 'حدث خطأ أثناء البحث.', 'error');
    }
}

// 6. تسجيل دخول الإدارة
function loginAdmin() {
    const u = document.getElementById('adm-u').value;
    const p = document.getElementById('adm-p').value;

    if (u === "admin" && p === "itws@manager@2026@") {
        sessionStorage.setItem("isAdmin", "true");
        Swal.fire({
            title: 'مرحباً بك يا مدير',
            text: 'جاري الدخول للوحة التحكم...',
            timer: 1500,
            showConfirmButton: false,
            willClose: () => { window.location.href = "admin.html"; }
        });
    } else {
        Swal.fire('فشل الدخول', 'اسم المستخدم أو كلمة المرور غير صحيحة.', 'error');
    }
}

// تشغيل افتراضي عند التحميل
toggleMemberFields();
