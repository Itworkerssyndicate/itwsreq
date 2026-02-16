// وظيفة إرسال الطلب
async function submitRequest() {
    const name = document.getElementById("user-fullname").value;
    const nId = document.getElementById("user-nationalid").value;
    const type = document.getElementById("request-type").value;
    const details = document.getElementById("request-details").value;
    const isMember = document.getElementById("is-member").value;
    const memberId = document.getElementById("membership-id").value;
    const gov = document.getElementById("user-gov").value;
    const job = document.getElementById("user-job").value;

    if (!name || nId.length !== 14 || !details) {
        alert("برجاء التأكد من إدخال كافة البيانات بشكل صحيح (الرقم القومي 14 رقم)");
        return;
    }

    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    // توليد المعرف: الشكوى (COM) والاقتراح (SUG)
    const prefix = (type === "complaint") ? "COM" : "SUG";
    const refId = `${prefix}-${randomNum}-${year}`;

    try {
        await db.collection("Requests").add({
            fullName: name,
            nationalId: nId,
            type: type,
            details: details,
            isMember: isMember,
            membershipId: (isMember === "yes") ? memberId : "N/A",
            governorate: gov,
            job: job,
            refId: refId,
            status: "تم الاستلام", // الحالة الابتدائية
            tracking: [{stage: "تم الاستلام", comment: "تم استلام طلبكم بنجاح وجاري المراجعة", date: new Date().toLocaleString()}],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // رسالة النجاح المخصصة
        if(type === "complaint") {
            alert(`شكراً لك، تم تسجيل شكواك برقم: ${refId}\nسيتم دراسة الشكوى والرد عليكم قريباً.`);
        } else {
            alert(`شكراً لاقتراحكم، تم تسجيله برقم: ${refId}\nنقابتنا تكبر بمقترحاتكم.`);
        }
        location.reload(); // إعادة تحميل الصفحة
    } catch (error) {
        console.error("Error: ", error);
        alert("حدث خطأ أثناء الإرسال، حاول مرة أخرى.");
    }
}
