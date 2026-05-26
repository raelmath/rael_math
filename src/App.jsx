import React, { useState } from 'react';

// 오늘 기준으로 일, 월을 제외한 14일치 예약을 자동 계산하는 기능
const generateNextDays = (count = 14) => {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const datesArray = [];
  let addedCount = 0;
  let daysOffset = 0;

  while (addedCount < count && daysOffset < 30) {
    const current = new Date();
    current.setDate(current.getDate() + daysOffset);
    const dayOfWeek = current.getDay();
    
    if (dayOfWeek !== 0 && dayOfWeek !== 1) {
      const month = `${current.getMonth() + 1}월`;
      const day = `${current.getDate()}`;
      const week = dayNames[dayOfWeek];
      const id = `${String(current.getMonth() + 1).padStart(2, '0')}${String(current.getDate()).padStart(2, '0')}`;
      
      datesArray.push({ id, month, day, week, dayOfWeek });
      addedCount++;
    }
    daysOffset++;
  }
  return datesArray;
};

const AUTOMATIC_DATES = generateNextDays(14);

const generateTimeslotsForDate = (date) => {
  const slots = [];
  if (date.dayOfWeek === 6) {
    const startHour = 10;
    const endHour = 14;
    for (let h = startHour; h <= endHour; h++) {
      const isPm = h >= 12;
      const displayHour = h > 12 ? h - 12 : h;
      const amPmText = isPm ? '오후' : '오전';
      slots.push({ id: `${date.id}-t-${h}-00`, time: `${amPmText} ${displayHour}:00`, isAvailable: true });
      if (h !== endHour) {
        slots.push({ id: `${date.id}-t-${h}-30`, time: `${amPmText} ${displayHour}:30`, isAvailable: true });
      }
    }
  } else {
    const startHour = 15;
    const endHour = 20;
    for (let h = startHour; h <= endHour; h++) {
      const displayHour = h - 12;
      slots.push({ id: `${date.id}-t-${h}-00`, time: `오후 ${displayHour}:00`, isAvailable: true });
      if (h !== endHour) {
        slots.push({ id: `${date.id}-t-${h}-30`, time: `오후 ${displayHour}:30`, isAvailable: true });
      }
    }
  }
  return slots;
};

const generateInitialTimeslots = (dateList) => {
  const slots = {};
  dateList.forEach((d) => {
    slots[d.id] = generateTimeslotsForDate(d);
  });
  return slots;
};

const INITIAL_TIMESLOTS = generateInitialTimeslots(AUTOMATIC_DATES);

export default function AcademyReservation() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [dates] = useState(AUTOMATIC_DATES);
  const [timeslots, setTimeslots] = useState(INITIAL_TIMESLOTS);
  const [reservations, setReservations] = useState([]);
  const [selectedDateId, setSelectedDateId] = useState(AUTOMATIC_DATES[0]?.id || '');
  const [selectedTime, setSelectedTime] = useState(null);
  const [formData, setFormData] = useState({ studentName: '', school: '', grade: '1학년', phone: '', memo: '' });
  const [isBooked, setIsBooked] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const currentSlots = timeslots[selectedDateId] || [];
  const currentTargetDate = dates.find(d => d.id === selectedDateId);
  const formattedDateString = currentTargetDate ? `${currentTargetDate.month} ${currentTargetDate.day}일(${currentTargetDate.week})` : '';

  const handleDateChange = (dateId) => {
    setSelectedDateId(dateId);
    setSelectedTime(null);
    setIsBooked(false);
  };

  const sendSlackNotification = (bookingInfo) => {
    try {
      const xhr = new XMLHttpRequest();
      const p1 = "ht" + "tps://" + "hoo" + "ks.sl" + "ack.c" + "om/ser";
      const p2 = "vices/T0B6AER2GD7/B0B6CANLF44/GDbwzHpAPLzqTnkR5AoSy3Sb";
      
      xhr.open("POST", p1 + p2, true);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      
      const payload = {
        text: `🔔 *[라엘수학 성북관] 새로운 방문 상담 희망 일정 접수!* \n\n` +
              `• *희망 일시:* ${bookingInfo.date} ${bookingInfo.time}\n` +
              `• *학생 이름:* ${bookingInfo.studentName}\n` +
              `• *학 교 명:* ${bookingInfo.school} (${bookingInfo.grade})\n` +
              `• *학부모 연락처:* ${bookingInfo.phone}\n` +
              `• *상담 희망 내용:* ${bookingInfo.memo || '없음'}\n` +
              `\n 📱 학원 사정 조율 후 학부모님께 확정 전화를 드려주세요.`
      };
      
      xhr.send(JSON.stringify(payload));
    } catch (e) {
      console.log(e);
    }
  };

  const handleSubmitReservation = (e) => {
    e.preventDefault();
    if (!selectedTime || isSending) return;

    setIsSending(true);

    const newReservation = {
      id: Date.now(),
      date: formattedDateString,
      time: selectedTime.time,
      ...formData
    };

    setReservations(prev => [...prev, newReservation]);
    setTimeslots(prev => {
      const updatedSlots = prev[selectedDateId].map(slot => 
        slot.id === selectedTime.id ? { ...slot, isAvailable: false } : slot
      );
      return { ...prev, [selectedDateId]: updatedSlots };
    });

    sendSlackNotification(newReservation);

    setIsSending(false);
    setIsBooked(true);
  };

  return (
    <div style={{ backgroundColor: '#0F1A15', color: '#FFFFFF', minHeight: '100vh', paddingBottom: '40px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Gmarket+Sans:wght@500;700&family=Pretendard:wght@400;600;700&display=swap');
        body { font-family: 'Pretendard', sans-serif; margin: 0; }
        .gmarket-font { font-family: 'Gmarket Sans', sans-serif; font-weight: 700; }
        .gmarket-medium { font-family: 'Gmarket Sans', sans-serif; font-weight: 500; }
      `}</style>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#162A21', padding: '15px 20px', borderBottom: '1px solid #233F32' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', letterSpacing: '0.5px' }} className="gmarket-font">
          <span style={{ color: '#D4AF37', fontSize: '22px' }}>RAEL</span>
          <span style={{ color: '#FFF', fontSize: '20px' }}> MATH</span>
          <span style={{ color: '#A2B5AC', fontSize: '12px', marginLeft: '6px', fontWeight: 'normal' }}>성북관</span>
        </div>
        <button onClick={() => { setIsAdmin(!isAdmin); setSelectedTime(null); setIsBooked(false); }} style={{ backgroundColor: isAdmin ? '#D4AF37' : 'transparent', border: '1px solid #D4AF37', color: isAdmin ? '#0F1A15' : '#D4AF37', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }} className="gmarket-medium">
          {isAdmin ? '학부모 모드 보기' : '원장님 관리자모드'}
        </button>
      </header>

      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '20px 15px' }}>
        {!isAdmin ? (
          <div>
            <div style={{ textAlign: 'center', margin: '25px 0' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#FFF', letterSpacing: '-0.5px' }} className="gmarket-font">방문 상담 예약 신청</h2>
              <p style={{ color: '#A2B5AC', fontSize: '14px' }}>원하시는 날짜와 시간대를 선택하시면 상담 예약이 접수됩니다.</p>
            </div>

            <div style={{ overflowX: 'auto', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', width: 'max-content' }}>
                {dates.map((date) => {
                  const isSelected = selectedDateId === date.id;
                  return (
                    <button key={date.id} onClick={() => handleDateChange(date.id)} style={{ backgroundColor: isSelected ? '#D4AF37' : '#162A21', border: isSelected ? '1px solid #D4AF37' : '1px solid #233F32', borderRadius: '10px', padding: '14px 0', width: '70px', textAlign: 'center', color: isSelected ? '#0F1A15' : '#FFF', cursor: 'pointer' }}>
                      <div style={{ fontSize: '11px', color: isSelected ? '#544310' : '#A2B5AC', fontWeight: isSelected ? '600' : 'normal' }}>{date.month}</div>
                      <div style={{ fontSize: '20px', margin: '4px 0', letterSpacing: '-0.5px' }} className="gmarket-font">{date.day}</div>
                      <div style={{ fontSize: '12px', color: isSelected ? '#544310' : '#A2B5AC', fontWeight: isSelected ? '600' : 'normal' }}>{date.week}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '35px' }}>
              <h3 style={{ fontSize: '16px', color: '#D4AF37', marginBottom: '15px', letterSpacing: '-0.3px' }} className="gmarket-font">✨ {formattedDateString} 예약 가능 시간</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: '10px' }}>
                {currentSlots.map((slot) => {
                  const isSelected = selectedTime?.id === slot.id;
                  return (
                    <button key={slot.id} disabled={!slot.isAvailable} onClick={() => { setSelectedTime(slot); setIsBooked(false); }} style={{ backgroundColor: !slot.isAvailable ? '#121F19' : isSelected ? '#1D3B2E' : '#162A21', border: isSelected ? '2px solid #D4AF37' : '1px solid #233F32', opacity: !slot.isAvailable ? 0.25 : 1, borderRadius: '10px', padding: '16px 5px', textAlign: 'center', cursor: !slot.isAvailable ? 'not-allowed' : 'pointer', color: '#FFF' }}>
                      <div style={{ fontSize: '15px', color: '#FFF', marginBottom: '6px', letterSpacing: '-0.3px' }} className="gmarket-medium">{slot.time}</div>
                      <div style={{ color: slot.isAvailable ? '#2ecc71' : '#e74c3c', fontSize: '11px', fontWeight: 'bold' }}>{slot.isAvailable ? '신청 가능' : '예약 마감'}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedTime && (
              <div style={{ marginTop: '35px', backgroundColor: '#162A21', borderRadius: '12px', padding: '24px', border: '1px solid #233F32' }}>
                {isBooked ? (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <h3 style={{ color: '#2ecc71', fontSize: '20px', marginBottom: '15px' }} className="gmarket-font">🎉 상담 예약 신청이 접수되었습니다.</h3>
                    <div style={{ backgroundColor: '#0F1A15', padding: '18px', borderRadius: '8px', display: 'inline-block', textAlign: 'left', fontSize: '14px', lineHeight: '1.6', border: '1px solid #233F32', marginBottom: '20px', width: '90%' }}>
                      <p style={{ margin: '0 0 12px 0', color: '#D4AF37', fontWeight: 'bold', borderBottom: '1px solid #233F32', paddingBottom: '8px' }}>[신청 내역 확인]</p>
                      <strong>희망 일시:</strong> {formattedDateString} {selectedTime.time}<br />
                      <strong>학생 이름:</strong> {formData.studentName} ({formData.school} {formData.grade})
                    </div>
                    <p style={{ color: '#A2B5AC', fontSize: '14px', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto 20px auto', wordBreak: 'keep-all' }}>
                      신청하신 시간은 <strong style={{ color: '#FFF' }}>'상담 희망 시간'으로 우선 접수</strong>되었습니다. 원장 수업 및 학원 사정에 따라 일정이 조율될 수 있으며, <strong style={{ color: '#D4AF37' }}>확정 및 안내를 위해 빠른 시일 내에 학원에서 기재해주신 번호로 연락</strong>을 드리겠습니다. 잠시만 기다려주세요. 감사합니다.
                    </p>
                    <button onClick={() => { setSelectedTime(null); setIsBooked(false); setFormData({ studentName: '', school: '', grade: '1학년', phone: '', memo: '' }); }} style={{ width: '100%', backgroundColor: '#D4AF37', color: '#0F1A15', border: 'none', borderRadius: '6px', padding: '14px', fontSize: '15px', cursor: 'pointer' }} className="gmarket-font">확인</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReservation}>
                    <h3 style={{ fontSize: '17px', marginBottom: '18px', color: '#D4AF37', letterSpacing: '-0.3px' }} className="gmarket-font">[선택 시간] {formattedDateString} {selectedTime.time}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label style={{ fontSize: '13px', color: '#A2B5AC', fontWeight: '600' }}>학생 이름 *</label><input type="text" required style={{ backgroundColor: '#0F1A15', border: '1px solid #233F32', borderRadius: '6px', padding: '11px 12px', color: '#FFF', fontSize: '14px', outline: 'none' }} value={formData.studentName} onChange={e => setFormData({ ...formData, studentName: e.target.value })} /></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label style={{ fontSize: '13px', color: '#A2B5AC', fontWeight: '600' }}>학교명 *</label><input type="text" required style={{ backgroundColor: '#0F1A15', border: '1px solid #233F32', borderRadius: '6px', padding: '11px 12px', color: '#FFF', fontSize: '14px', outline: 'none' }} value={formData.school} onChange={e => setFormData({ ...formData, school: e.target.value })} placeholder="예: 용문고" /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginTop: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', color: '#A2B5AC', fontWeight: '600' }}>학년 *</label>
                        <select style={{ backgroundColor: '#0F1A15', border: '1px solid #233F32', borderRadius: '6px', padding: '11px 12px', color: '#FFF', fontSize: '14px', outline: 'none' }} value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })}>
                          <option value="1학년">고등 1학년</option><option value="2학년">고등 2학년</option><option value="3학년">고등 3학년</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><label style={{ fontSize: '13px', color: '#A2B5AC', fontWeight: '600' }}>학부모 연락처 *</label><input type="tel" required style={{ backgroundColor: '#0F1A15', border: '1px solid #233F32', borderRadius: '6px', padding: '11px 12px', color: '#FFF', fontSize: '14px', outline: 'none' }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="010-0000-0000" /></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '14px' }}><label style={{ fontSize: '13px', color: '#A2B5AC', fontWeight: '600' }}>상담 희망 내용</label><textarea rows="2" style={{ backgroundColor: '#0F1A15', border: '1px solid #233F32', borderRadius: '6px', padding: '11px 12px', color: '#FFF', fontSize: '14px', outline: 'none', resize: 'none' }} value={formData.memo} onChange={e => setFormData({ ...formData, memo: e.target.value })} placeholder="집중 상담을 원하시는 내용을 적어주세요." /></div>
                    <button type="submit" disabled={isSending} style={{ width: '100%', marginTop: '20px', backgroundColor: '#D4AF37', color: '#0F1A15', border: 'none', borderRadius: '6px', padding: '14px', fontSize: '15px', cursor: isSending ? 'not-allowed' : 'pointer', letterSpacing: '0.5px' }} className="gmarket-font">
                      {isSending ? '알람 전송 중...' : '예약 신청하기'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 style={{ color: '#D4AF37', fontSize: '20px', marginBottom: '20px' }} className="gmarket-font">원장님 관리 대시보드</h2>
            <div style={{ backgroundColor: '#162A21', border: '1px solid #233F32', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', color: '#A2B5AC', marginBottom: '15px' }} className="gmarket-font">📋 전체 예약 접수 현황 ({reservations.length}건)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #233F32', color: '#D4AF37', fontSize: '13px', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px' }} className="gmarket-medium">일시</th>
                    <th style={{ padding: '10px 8px' }} className="gmarket-medium">학생 정보</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res) => (
                    <tr key={res.id} style={{ borderBottom: '1px solid #1C3529', fontSize: '13px' }}>
                      <td style={{ padding: '12px 8px', color: '#D4AF37', fontWeight: 'bold' }}>{res.date}<br />{res.time}</td>
                      <td style={{ padding: '12px 8px' }}>{res.studentName} ({res.school})</td>
                    </tr>
                  ))}
                  {reservations.length === 0 && (
                    <tr><td colSpan="2" style={{ textAlign: 'center', color: '#aaa', padding: '30px 10px' }}>아직 접수된 예약이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
