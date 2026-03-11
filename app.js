// =====================================================================
// VR 2.05.2026 - دوال التطبيق الرئيسية (الصفحة الأمامية)
// الإصدار الماسي - النسخة النهائية
// جميع الحقوق محفوظة لنقابة تكنولوجيا المعلومات والبرمجيات © 2026
// =====================================================================

// ------------------------------ متغيرات عامة ------------------------------
let currentRequestData = null; // تخزين بيانات الطلب الحالي مؤقتاً

// ------------------------------ دوال تبديل المشاهد ------------------------------

/**
 * تبديل المشاهد (تقديم طلب / استعلام / دخول الأدمن)
 * @param {string} view - اسم المشهد (submit, track, admin-login)
 */
function switchView(view) {
    // إخفاء جميع المشاهد
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    
    // إزالة التفعيل من جميع الأزرار
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // إظهار المشهد المطلوب
    const targetView = document.getElementById('view-' + view);
    if (targetView) {
        targetView.style.display = 'block';
    }
    
    // تفعيل الزر المناسب
    const buttons = document.querySelectorAll('.nav-btn');
    if (view === 'submit' && buttons[0]) {
        buttons[0].classList.add('active');
    } else if (view === 'track' && buttons[1]) {
        buttons[1].classList.add('active');
    } else if (view === 'admin-login' && buttons[2]) {
        buttons[2].classList.add('active');
    }
}

// ------------------------------ دوال نموذج تقديم الطلب ------------------------------

/**
 * تبديل حقل العضوية بناءً على نوع مقدم الطلب
 */
function toggleMemberField() {
    const memberType = document.getElementById('u-member-type')?.value;
    const memberBox = document.getElementById('member-id-box');
    const reqTypeSelect = document.getElementById('u-req-type');
    
    if (!memberBox || !reqTypeSelect) return;
    
    if (memberType === 'عضو نقابة') {
        // إظهار حقل رقم العضوية
        memberBox.style.display = 'block';
        
        // الأعضاء يمكنهم تقديم شكوى أو اقتراح
        reqTypeSelect.innerHTML = `
            <option value="شكوى">شكوى</option>
            <option value="اقتراح">اقتراح</option>
        `;
    } else {
        // إخفاء حقل رقم العضوية
        memberBox.style.display = 'none';
        
        // غير الأعضاء يمكنهم تقديم اقتراح فقط
        reqTypeSelect.innerHTML = `
            <option value="اقتراح">اقتراح فقط</option>
        `;
    }
}

/**
 * التحقق من صحة نموذج تقديم الطلب
 * @returns {Object|null} كائن البيانات إذا كان صحيحاً، أو null إذا كان هناك خطأ
 */
function validateSubmitForm() {
    // الحصول على قيم الحقول
    const name = document.getElementById('u-name')?.value.trim();
    const nid = document.getElementById('u-nid')?.value.trim();
    const phone = document.getElementById('u-phone')?.value.trim();
    const gov = document.getElementById('u-gov')?.value;
    const address = document.getElementById('u-address')?.value.trim();
    const job = document.getElementById('u-job')?.value.trim();
    const type = document.getElementById('u-req-type')?.value;
    const details = document.getElementById('u-details')?.value.trim();
    const memberType = document.getElementById('u-member-type')?.value;
    const memberId = document.getElementById('u-member-id')?.value.trim() || "غير عضو";

    // التحقق من الحقول المطلوبة
    if (!name || !nid || !phone || !gov || !address || !job || !details) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'برجاء ملء جميع البيانات المطلوبة',
            background: '#030514',
            confirmButtonColor: '#00ffff',
            confirmButtonText: 'حسناً'
        });
        return null;
    }

    // التحقق من صحة الاسم (على الأقل 3 كلمات)
    if (name.split(' ').length < 2) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'برجاء إدخال الاسم ثلاثياً على الأقل',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        return null;
    }

    // التحقق من الرقم القومي
    if (!validateNationalID(nid)) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'الرقم القومي يجب أن يكون 14 رقماً',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        return null;
    }

    // التحقق من رقم الهاتف
    if (!validatePhone(phone)) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقم)',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        return null;
    }

    // التحقق من رقم العضوية للأعضاء
    if (memberType === 'عضو نقابة' && !memberId) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'برجاء إدخال رقم العضوية',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        return null;
    }

    // التحقق من طول التفاصيل
    if (details.length < 20) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'التفاصيل يجب أن تكون على الأقل 20 حرفاً',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        return null;
    }

    // إرجاع البيانات إذا كانت صحيحة
    return {
        name, nid, phone, gov, address, job, type, details, memberType, memberId
    };
}

// ------------------------------ دوال إنشاء كارت الطلب ------------------------------

/**
 * إنشاء كارت الطلب كصورة
 * @param {Object} data - بيانات الطلب
 */
async function generateRequestCard(data) {
    const logo = getSavedLogo();
    const date = getCurrentArabicDate();
    const time = getCurrentArabicTime();
    
    const container = document.getElementById('request-card-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // إنشاء الكارت
    const card = document.createElement('div');
    card.style.cssText = `
        width: 600px;
        padding: 40px;
        background: linear-gradient(135deg, #0a0f1f, #030514);
        border-radius: 40px;
        border: 5px solid #00ffff;
        font-family: 'Tajawal', 'Cairo', sans-serif;
        color: white;
        text-align: center;
        direction: rtl;
        box-shadow: 0 30px 50px rgba(0,255,255,0.5);
        position: relative;
        overflow: hidden;
    `;
    
    // خلفية متحركة للكارت
    const glow = document.createElement('div');
    glow.style.cssText = `
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(0,255,255,0.2), transparent 70%);
        animation: rotate 15s linear infinite;
        pointer-events: none;
    `;
    card.appendChild(glow);
    
    // إضافة الـ keyframes للحركة
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    card.appendChild(style);
    
    // الشعار
    const logoImg = document.createElement('img');
    logoImg.src = logo;
    logoImg.style.cssText = `
        width: 130px;
        height: 130px;
        border-radius: 50%;
        border: 4px solid #00ffff;
        margin-bottom: 20px;
        object-fit: cover;
        display: block;
        margin-left: auto;
        margin-right: auto;
        box-shadow: 0 0 40px #00ffff;
        position: relative;
        z-index: 2;
    `;
    
    // المحتوى
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = `position: relative; z-index: 2;`;
    
    // تحديد لون نوع الطلب
    const typeColor = data.type === 'شكوى' ? '#ef4444' : '#10b981';
    
    contentDiv.innerHTML = `
        <h2 style="font-size: 28px; background: linear-gradient(135deg, #00ffff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 10px 0; font-weight: 900;">نقابة تكنولوجيا المعلومات والبرمجيات</h2>
        <h3 style="font-size: 22px; color: white; margin: 5px 0;">المهندس / محمود جميل</h3>
        <p style="color: rgba(255,255,255,0.6); font-size: 18px; margin-bottom: 25px;">النقيب العام</p>
        
        <div style="background: rgba(0,255,255,0.1); padding: 20px; border-radius: 25px; margin: 20px 0; border: 2px solid rgba(0,255,255,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: rgba(255,255,255,0.6); font-weight: 600; font-size: 18px;">رقم الطلب :</span>
                <span style="color: #00ffff; font-weight: 700; direction: ltr; font-size: 20px;">${data.refId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: rgba(255,255,255,0.6); font-weight: 600; font-size: 18px;">نوع الطلب :</span>
                <span style="color: ${typeColor}; font-weight: 700; font-size: 20px;">${data.type}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: rgba(255,255,255,0.6); font-weight: 600; font-size: 18px;">اسم مقدم الطلب :</span>
                <span style="font-weight: 600; font-size: 20px;">${data.name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
                <span style="color: rgba(255,255,255,0.6); font-weight: 600; font-size: 18px;">تاريخ التقديم :</span>
                <span style="font-weight: 600; font-size: 20px;">${date} - ${time}</span>
            </div>
        </div>
        
        <div style="color: rgba(255,255,255,0.4); font-size: 14px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 15px;">
            هذا الكارت معتمد من نقابة تكنولوجيا المعلومات والبرمجيات
        </div>
        <div style="color: #00ffff; font-size: 12px; margin-top: 10px; font-family: 'Orbitron', monospace;">
            VR 2.05.2026
        </div>
    `;
    
    card.appendChild(logoImg);
    card.appendChild(contentDiv);
    container.appendChild(card);
    
    // التقاط الكارت كصورة
    try {
        // استخدام dom-to-image إذا كان متاحاً
        if (typeof domtoimage !== 'undefined') {
            const dataUrl = await domtoimage.toPng(card, {
                quality: 1,
                bgcolor: '#030514',
                width: 600,
                height: card.offsetHeight
            });
            
            await showCardResult(dataUrl, data, card.offsetHeight);
        }
        // استخدام html2canvas كبديل
        else if (typeof html2canvas !== 'undefined') {
            const canvas = await html2canvas(card, {
                scale: 2,
                backgroundColor: '#030514'
            });
            
            await showCardResult(canvas.toDataURL('image/png'), data, canvas.height);
        }
        else {
            // إذا لم تكن المكتبات متاحة
            Swal.fire({
                icon: 'info',
                title: 'تم حفظ الطلب',
                html: `
                    <div style="text-align: center;">
                        <div style="color: #00ffff; font-size: 24px; margin-bottom: 10px;">${data.refId}</div>
                        <p style="color: #fff;">احتفظ برقم الطلب لمتابعته</p>
                    </div>
                `,
                background: '#030514',
                confirmButtonColor: '#00ffff'
            });
        }
    } catch (error) {
        console.error('خطأ في إنشاء الكارت:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في إنشاء الكارت، ولكن تم حفظ الطلب بنجاح',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
    }
    
    // تنظيف
    setTimeout(() => {
        container.innerHTML = '';
    }, 1000);
}

/**
 * عرض نتيجة الكارت للمستخدم
 * @param {string} imageData - بيانات الصورة
 * @param {Object} data - بيانات الطلب
 * @param {number} height - ارتفاع الصورة
 */
async function showCardResult(imageData, data, height) {
    const result = await Swal.fire({
        title: '✅ تم حفظ الطلب بنجاح',
        html: `
            <div style="text-align: center;">
                <div style="color: #00ffff; font-size: 28px; margin-bottom: 15px; font-weight: 900;">${data.refId}</div>
                <p style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">يمكنك تحميل الكارت الآن</p>
            </div>
        `,
        imageUrl: imageData,
        imageWidth: 500,
        imageHeight: height * 500 / 600,
        showCancelButton: true,
        confirmButtonText: '📥 تحميل الكارت',
        cancelButtonText: '❌ إغلاق',
        confirmButtonColor: '#00ffff',
        cancelButtonColor: 'rgba(255,255,255,0.2)',
        background: '#030514',
        color: '#fff',
        allowOutsideClick: false,
        customClass: {
            image: 'swal2-image-custom'
        }
    });
    
    if (result.isConfirmed) {
        const link = document.createElement('a');
        link.download = `طلب_${data.refId}.png`;
        link.href = imageData;
        link.click();
    }
}

// ------------------------------ دوال تقديم الطلب ------------------------------

/**
 * معالجة تقديم الطلب
 */
async function handleSubmit() {
    // التحقق من صحة النموذج
    const formData = validateSubmitForm();
    if (!formData) return;

    try {
        // إظهار رسالة التحميل
        Swal.fire({
            title: 'جاري حفظ الطلب',
            text: 'الرجاء الانتظار...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            background: '#030514',
            color: '#fff'
        });

        // إنشاء رقم الطلب
        const refId = await generateRequestNumber(formData.type);
        
        // تحديد الحالة الابتدائية
        const initialStatus = formData.type === 'شكوى' ? "تم الاستلام" : "لم يقرأ";
        
        // إعداد بيانات الطلب
        const requestData = {
            refId,
            ...formData,
            status: initialStatus,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            tracking: [{
                status: initialStatus,
                comment: formData.type === 'شكوى' 
                    ? "تم استلام شكواك بنجاح، وسيتم مراجعتها من قبل اللجنة المختصة" 
                    : "تم استلام اقتراحك بنجاح، شكراً لمشاركتك",
                time: new Date().toLocaleString('ar-EG'),
                isFinal: false
            }]
        };

        // حفظ في Firebase
        await db.collection("Requests").doc(refId).set(requestData);
        
        // إغلاق رسالة التحميل
        Swal.close();
        
        // إنشاء كارت الطلب
        await generateRequestCard(requestData);
        
        // مسح الحقول
        clearSubmitForm();
        
    } catch (error) {
        console.error("خطأ في تقديم الطلب:", error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في حفظ الطلب، برجاء المحاولة مرة أخرى',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
    }
}

/**
 * مسح حقول نموذج تقديم الطلب
 */
function clearSubmitForm() {
    const fields = [
        'u-name', 'u-nid', 'u-phone', 'u-address', 
        'u-job', 'u-details', 'u-member-id'
    ];
    
    fields.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
    });
    
    // إعادة تعيين القوائم المنسدلة
    const memberType = document.getElementById('u-member-type');
    if (memberType) memberType.value = 'عضو نقابة';
    
    const gov = document.getElementById('u-gov');
    if (gov) gov.value = 'القاهرة';
    
    const reqType = document.getElementById('u-req-type');
    if (reqType) {
        reqType.innerHTML = `
            <option value="شكوى">شكوى</option>
            <option value="اقتراح">اقتراح</option>
        `;
    }
    
    // إظهار حقل العضوية (لأن الافتراضي عضو نقابة)
    const memberBox = document.getElementById('member-id-box');
    if (memberBox) memberBox.style.display = 'block';
}

// ------------------------------ دوال الاستعلام عن الطلب ------------------------------

/**
 * معالجة الاستعلام عن طلب
 */
async function handleTrack() {
    const nid = document.getElementById('q-nid')?.value.trim();
    const ref = document.getElementById('q-ref')?.value.trim();
    const type = document.getElementById('q-type')?.value;

    if (!nid || !ref || !type) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'برجاء إدخال جميع البيانات',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        return;
    }

    try {
        // إظهار رسالة التحميل
        Swal.fire({
            title: 'جاري البحث',
            text: 'الرجاء الانتظار...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            background: '#030514',
            color: '#fff'
        });

        // البحث في Firebase
        const snapshot = await db.collection("Requests")
            .where("nid", "==", nid)
            .where("refId", "==", ref)
            .where("type", "==", type)
            .get();

        Swal.close();

        if (snapshot.empty) {
            Swal.fire({
                icon: 'error',
                title: 'عذراً',
                text: 'لا يوجد طلب بهذه البيانات',
                background: '#030514',
                confirmButtonColor: '#00ffff'
            });
            return;
        }
        
        const requestData = snapshot.docs[0].data();
        
        // تحويل التاريخ إذا كان موجوداً
        if (requestData.createdAt && requestData.createdAt.toDate) {
            requestData.createdAtDate = requestData.createdAt.toDate();
        }
        
        // عرض نتيجة الاستعلام
        renderTrackResult(requestData);
        
    } catch (error) {
        console.error("خطأ في الاستعلام:", error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في الاستعلام، برجاء المحاولة مرة أخرى',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
    }
}

/**
 * عرض نتيجة الاستعلام
 * @param {Object} data - بيانات الطلب
 */
function renderTrackResult(data) {
    // تجهيز المسار الزمني
    const stages = [...(data.tracking?.map(t => t.status) || []), "تم الإغلاق النهائي"];
    const currentIdx = stages.indexOf(data.status);
    const progress = stages.length > 0 ? (currentIdx / (stages.length - 1)) * 100 : 0;
    
    // تنسيق التاريخ
    let dateStr = 'غير محدد';
    if (data.createdAtDate) {
        dateStr = data.createdAtDate.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // إنشاء HTML للمسار الزمني
    let timelineHtml = '';
    if (data.tracking && data.tracking.length > 0) {
        timelineHtml = data.tracking.slice().reverse().map(t => `
            <div class="timeline-card" style="background: rgba(255,255,255,0.02); border-right: 3px solid var(--neon-cyan); padding: 12px; margin-bottom: 8px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="color: var(--neon-cyan); font-weight: 600;">${t.status}</span>
                    <span style="color: rgba(255,255,255,0.4); font-size: 11px;">${t.time}</span>
                </div>
                <p style="color: rgba(255,255,255,0.7); font-size: 12px;">${t.comment}</p>
            </div>
        `).join('');
    }

    const html = `
        <div class="luxury-card" style="margin-top: 20px;">
            <div class="card-glow"></div>
            
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                <div style="width: 70px; height: 70px; background: var(--gradient-royal); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-qrcode" style="font-size: 35px; color: #fff;"></i>
                </div>
                <div>
                    <h3 style="color: var(--neon-cyan); font-size: 24px;">${data.refId}</h3>
                    <p style="color: rgba(255,255,255,0.7);">${data.name}</p>
                </div>
            </div>
            
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 15px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div><span style="color: rgba(255,255,255,0.5);">النوع:</span> ${data.type}</div>
                    <div><span style="color: rgba(255,255,255,0.5);">الحالة:</span> ${data.status}</div>
                    <div><span style="color: rgba(255,255,255,0.5);">تاريخ التقديم:</span> ${dateStr}</div>
                    <div><span style="color: rgba(255,255,255,0.5);">المحافظة:</span> ${data.gov}</div>
                </div>
            </div>
            
            <div class="track-container" style="margin: 30px 0;">
                <div class="track-line-bg"></div>
                <div class="track-line-fill" style="width: ${progress}%;"></div>
                <div class="track-points">
                    ${stages.map((s, i) => `
                        <div class="track-point">
                            <div class="track-dot ${i <= currentIdx ? 'active' : ''}">
                                ${i <= currentIdx ? '<i class="fas fa-check"></i>' : ''}
                            </div>
                            <span class="track-label">${s}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <h4 style="color: var(--neon-cyan); margin-bottom: 10px;">المسار الزمني</h4>
            <div style="max-height: 300px; overflow-y: auto;">
                ${timelineHtml}
            </div>
        </div>
    `;
    
    const resultBox = document.getElementById('track-result-box');
    if (resultBox) {
        resultBox.innerHTML = html;
        resultBox.style.display = 'block';
        
        // التمرير إلى النتيجة
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ------------------------------ دوال دخول الأدمن ------------------------------

/**
 * معالجة دخول الأدمن
 */
function adminLogin() {
    const username = document.getElementById('adm-user')?.value.trim();
    const password = document.getElementById('adm-pass')?.value.trim();
    
    // التحقق من البيانات
    if (username === 'admin' && password === 'itws@2026') {
        // حفظ حالة تسجيل الدخول
        localStorage.setItem('admin', 'true');
        
        Swal.fire({
            icon: 'success',
            title: 'مرحباً بك',
            text: 'جاري تحويلك إلى لوحة التحكم',
            timer: 1500,
            showConfirmButton: false,
            background: '#030514',
            color: '#fff'
        }).then(() => {
            window.location.href = 'admin.html';
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'اسم المستخدم أو كلمة المرور غير صحيحة',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
    }
}

// ------------------------------ دوال إضافية ------------------------------

/**
 * إنشاء جزيئات متطايرة في الخلفية
 */
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    const colors = ['#00ffff', '#a855f7', '#ec4899', '#3b82f6'];
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // موقع عشوائي
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // لون عشوائي من الألوان المتاحة
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        // حجم عشوائي
        const size = 2 + Math.random() * 4;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // مدة حركة عشوائية
        particle.style.animationDuration = (10 + Math.random() * 20) + 's';
        
        // تأخير عشوائي
        particle.style.animationDelay = (Math.random() * 10) + 's';
        
        container.appendChild(particle);
    }
}

/**
 * إخفاء شاشة البداية بعد التحميل
 */
function hideSplashScreen() {
    const splash = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    
    if (splash && mainContent) {
        setTimeout(() => {
            splash.style.display = 'none';
            mainContent.style.display = 'block';
        }, 3000);
    }
}

// ------------------------------ التهيئة عند تحميل الصفحة ------------------------------

document.addEventListener('DOMContentLoaded', function() {
    // إنشاء الجزيئات
    createParticles();
    
    // إخفاء شاشة البداية
    hideSplashScreen();
    
    // تفعيل المشهد الافتراضي (تقديم طلب)
    switchView('submit');
    
    // إخفاء حقل العضوية إذا كان غير عضو افتراضياً
    const memberType = document.getElementById('u-member-type');
    const memberBox = document.getElementById('member-id-box');
    
    if (memberType && memberBox) {
        if (memberType.value === 'غير عضو') {
            memberBox.style.display = 'none';
        }
        
        // تحديث نوع الطلب بناءً على العضوية
        const reqType = document.getElementById('u-req-type');
        if (reqType) {
            if (memberType.value === 'غير عضو') {
                reqType.innerHTML = '<option value="اقتراح">اقتراح فقط</option>';
            }
        }
    }
    
    // إضافة مستمع لتغيير نوع العضوية
    if (memberType) {
        memberType.addEventListener('change', toggleMemberField);
    }
    
    console.log('✅ تم تحميل الصفحة الرئيسية بنجاح');
});

// ------------------------------ نهاية ملف التطبيق ------------------------------
