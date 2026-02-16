// دوال التبديل لمنع التشنج
function openTab(id) {
    document.querySelectorAll('.content-tab').forEach(t => t.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

// دالة البحث الثلاثي المحدثة
async function startTracking() {
    const nid = document.getElementById('s-nid').value;
    const ref = document.getElementById('s-ref').value;
    const type = document.getElementById('s-type').value;

    if(!nid || !ref) return Swal.fire("تنبيه", "برجاء ادخال الرقم القومي ورقم الطلب", "warning");

    const snap = await db.collection("Requests")
        .where("nationalId", "==", nid)
        .where("refId", "==", ref)
        .where("type", "==", type).get();

    if(snap.empty) return Swal.fire("خطأ", "لم يتم العثور على بيانات مطابقة", "error");

    const data = snap.docs[0].data();
    drawTrack(data);
}

function drawTrack(d) {
    // المراحل الأساسية (البداية، المراحل الوسيطة، النهاية)
    const stages = ["استلام الطلب", "ارسال الطلب", "اغلاق الطلب"];
    const currentStatus = d.status;
    const currentIndex = stages.indexOf(currentStatus) === -1 ? 1 : stages.indexOf(currentStatus);
    const progressPercent = (currentIndex / (stages.length - 1)) * 100;

    document.getElementById('tracking-result').innerHTML = `
        <div class="water-track-container">
            <div class="water-fill" style="width: ${progressPercent}%"></div>
            ${stages.map((s, i) => `
                <div class="step-node ${i <= currentIndex ? 'done' : ''}" style="right: ${(i/(stages.length-1))*100}%">
                    <span class="step-name">${s}</span>
                </div>
            `).join('')}
        </div>
        <div class="history-list">
            <h4 style="margin-bottom:15px; color:var(--primary)">السجل الزمني (من الأحدث):</h4>
            ${d.tracking.slice().reverse().map(t => `
                <div class="history-item ${t.isFinal ? 'final-decision' : ''}">
                    ${t.isFinal ? '<span class="final-badge">القرار النهائي</span>' : ''}
                    <div style="font-size:12px; color:#64748b">${t.date}</div>
                    <div style="margin-top:5px"><b>${t.stage}:</b> ${t.comment}</div>
                </div>
            `).join('')}
        </div>
    `;
}
