// ... Firebase Config ...

function showSection(s) {
    document.querySelectorAll('.sections').forEach(div => div.style.display = 'none');
    document.getElementById('sec-' + s).style.display = 'block';
}

async function fetchTracking() {
    const nid = document.getElementById('q-nid').value;
    const ref = document.getElementById('q-ref').value;
    const type = document.getElementById('q-type').value;

    const res = await db.collection("Requests")
        .where("nationalId", "==", nid)
        .where("refId", "==", ref)
        .where("type", "==", type).get();

    if(res.empty) return Swal.fire("عذراً", "لا توجد بيانات", "error");
    
    const d = res.docs[0].data();
    renderWaterTrack(d);
}

function renderWaterTrack(d) {
    const stages = ["استلام الطلب", ...d.tracking.filter(t=>t.stage!="استلام الطلب" && t.stage!="اغلاق الطلب").map(t=>t.stage), "اغلاق الطلب"];
    const current = d.status === "تم الحل" ? stages.length - 1 : stages.indexOf(d.status);
    const pct = (current / (stages.length - 1)) * 100;

    document.getElementById('track-display').innerHTML = `
        <div class="water-bar">
            <div class="water-progress" style="width: ${pct}%"></div>
            ${stages.map((s, i) => `
                <div class="track-point ${i <= current ? 'active' : ''}" style="right: ${(i/(stages.length-1))*100}%">
                    <span>${s}</span>
                </div>
            `).join('')}
        </div>
        <div class="timeline">
            ${d.tracking.slice().reverse().map(t => `
                <div class="time-card ${t.isFinal ? 'final' : ''}">
                    ${t.isFinal ? '<span class="final-text">🚩 القرار النهائي</span>' : ''}
                    <small style="color:#64748b">${t.date}</small>
                    <p><strong>${t.stage}:</strong> ${t.comment}</p>
                </div>
            `).join('')}
        </div>`;
}
