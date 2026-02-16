// دوال التبديل بين الشاشات لمنع "التشنج"
function switchTab(tab) {
    document.getElementById('view-submit').style.display = tab === 'submit' ? 'block' : 'none';
    document.getElementById('view-track').style.display = tab === 'track' ? 'block' : 'none';
}

async function getTrack() {
    // كود جلب البيانات من الفايربيز (القومي + رقم الطلب + النوع)
    // بعد جلب البيانات d:
    renderTrack(d);
}

function renderTrack(d) {
    const stages = ["استلام الطلب", "ارسال الطلب", "اغلاق الطلب"]; 
    // ملاحظة: يمكنك إضافة مراحل ديناميكية هنا بين البداية والنهاية
    
    let trackHtml = `
        <div class="water-track">
            <div class="water-fill" style="width: 50%"></div> ${stages.map((s, i) => `
                <div class="node active" style="right: ${(i/(stages.length-1))*100}%">
                    <div class="node-label">${s}</div>
                </div>
            `).join('')}
        </div>
        <div class="timeline">
            ${d.tracking.slice().reverse().map(t => `
                <div class="time-card ${t.isFinal ? 'final' : ''}">
                    ${t.isFinal ? '<span class="final-mark">🏁 القرار النهائي</span>' : ''}
                    <small>${t.date}</small>
                    <p><strong>${t.stage}:</strong> ${t.comment}</p>
                </div>
            `).join('')}
        </div>
    `;
    document.getElementById('track-output').innerHTML = trackHtml;
}
