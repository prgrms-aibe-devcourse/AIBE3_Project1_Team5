// PDF 생성을 위한 유틸리티 함수
import { TravelPlan } from '@/lib/openai';

export interface PDFGeneratorOptions {
  format?: 'A4' | 'A3';
  orientation?: 'portrait' | 'landscape';
  includeImages?: boolean;
}

// HTML을 PDF로 변환하는 함수
export async function generateTravelPlanPDF(
  plan: TravelPlan, 
  options: PDFGeneratorOptions = {}
): Promise<Blob> {
  const { format = 'A4', orientation = 'portrait', includeImages = true } = options;

  // HTML 템플릿 생성
  const htmlContent = generateHTMLTemplate(plan, includeImages);
  
  // 브라우저의 print API를 사용하여 PDF 생성
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('팝업이 차단되었습니다. 팝업을 허용하고 다시 시도해주세요.');
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // 프린트 다이얼로그 실행
  printWindow.focus();
  printWindow.print();
  
  // 잠시 후 창 닫기
  setTimeout(() => {
    printWindow.close();
  }, 1000);

  // Blob 반환 (실제로는 브라우저 프린트 기능을 사용)
  return new Blob([''], { type: 'application/pdf' });
}

// HTML을 이미지로 변환하는 함수 (html2canvas 사용 예정)
export async function generateTravelPlanImage(
  plan: TravelPlan,
  format: 'png' | 'jpeg' = 'png'
): Promise<Blob> {
  try {
    // 임시 요소 생성
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = generateHTMLTemplate(plan, true);
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    
    document.body.appendChild(tempDiv);

    // Canvas로 변환 (html2canvas가 설치되어 있다면)
    // const canvas = await html2canvas(tempDiv);
    // const blob = await new Promise<Blob>((resolve) => {
    //   canvas.toBlob((blob) => resolve(blob!), `image/${format}`);
    // });

    // html2canvas가 없는 경우 fallback
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 800;
    canvas.height = 1200;
    
    if (ctx) {
      // 배경 색상 설정
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 제목 그리기
      ctx.fillStyle = 'black';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(plan.title, 20, 50);
      
      // 기본 정보 그리기
      ctx.font = '16px Arial';
      let yPos = 100;
      
      if (plan.overview) {
        ctx.fillText(`일정: ${plan.overview.dates}`, 20, yPos);
        yPos += 30;
        ctx.fillText(`인원: ${plan.overview.people}`, 20, yPos);
        yPos += 30;
        ctx.fillText(`예산: ${plan.overview.budgetRange}`, 20, yPos);
        yPos += 50;
      }
      
      // 간단한 일정 표시
      plan.schedule.forEach((day, index) => {
        if (yPos > canvas.height - 100) return; // 공간 부족하면 중단
        
        ctx.font = 'bold 18px Arial';
        ctx.fillText(day.title, 20, yPos);
        yPos += 30;
        
        ctx.font = '14px Arial';
        day.items.slice(0, 3).forEach((item) => {
          if (yPos < canvas.height - 30) {
            ctx.fillText(`${item.time} ${item.activity}`, 40, yPos);
            yPos += 25;
          }
        });
        yPos += 20;
      });
    }

    // Canvas를 Blob으로 변환
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), `image/${format}`);
    });

    // 임시 요소 제거
    document.body.removeChild(tempDiv);

    return blob;
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('이미지 생성 중 오류가 발생했습니다.');
  }
}

// HTML 템플릿 생성 함수
function generateHTMLTemplate(plan: TravelPlan, includeImages: boolean): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${plan.title}</title>
      <style>
        @media print {
          @page {
            margin: 1cm;
            size: A4 portrait;
          }
          body {
            font-family: 'Malgun Gothic', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            font-size: 12px;
          }
        }
        body {
          font-family: 'Malgun Gothic', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #0066cc;
          padding-bottom: 20px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #0066cc;
          margin-bottom: 10px;
        }
        .overview-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .overview-table th,
        .overview-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .overview-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .day-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .day-title {
          font-size: 18px;
          font-weight: bold;
          color: #0066cc;
          margin-bottom: 15px;
          border-bottom: 1px solid #0066cc;
          padding-bottom: 5px;
        }
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .schedule-table th,
        .schedule-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        .schedule-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .time-col {
          width: 80px;
          font-family: monospace;
          color: #0066cc;
          font-weight: bold;
        }
        .activity-col {
          width: 60%;
        }
        .note-col {
          width: 30%;
        }
        .status {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: bold;
        }
        .status-confirmed {
          background-color: #d4edda;
          color: #155724;
        }
        .status-pending {
          background-color: #fff3cd;
          color: #856404;
        }
        .status-cancelled {
          background-color: #f8d7da;
          color: #721c24;
        }
        .cost {
          color: #28a745;
          font-weight: bold;
        }
        .total-cost {
          background-color: #e3f2fd;
          font-weight: bold;
          color: #0066cc;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
          border-left: 4px solid #0066cc;
          padding-left: 10px;
        }
        .tip-item, .requirement-item {
          margin-bottom: 8px;
          padding: 5px 0;
        }
        .emergency-info {
          background-color: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 5px;
          padding: 15px;
          margin-top: 20px;
        }
        .page-break {
          page-break-before: always;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <!-- 헤더 -->
      <div class="header">
        <div class="title">${plan.title}</div>
        <div>생성일: ${new Date().toLocaleDateString('ko-KR')}</div>
      </div>

      <!-- 여행 개요 -->
      <div class="section">
        <div class="section-title">📌 여행 개요</div>
        <table class="overview-table">
          <tr>
            <th>항목</th>
            <th>내용</th>
          </tr>
          ${plan.overview ? `
          <tr>
            <td>여행 일정</td>
            <td>${plan.overview.dates}</td>
          </tr>
          <tr>
            <td>인원</td>
            <td>${plan.overview.people}</td>
          </tr>
          <tr>
            <td>교통</td>
            <td>${plan.overview.transportation}</td>
          </tr>
          <tr>
            <td>숙소</td>
            <td>${plan.overview.accommodation}</td>
          </tr>
          <tr>
            <td>여행 테마</td>
            <td>${plan.overview.theme}</td>
          </tr>
          <tr>
            <td>총 예상 예산</td>
            <td><strong>${plan.overview.budgetRange}</strong></td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- 일별 상세 일정 -->
      ${plan.schedule.map((day, index) => `
        <div class="day-section ${index > 0 ? 'page-break' : ''}">
          <div class="day-title">📅 ${day.title}</div>
          <table class="schedule-table">
            <thead>
              <tr>
                <th class="time-col">시간</th>
                <th class="activity-col">일정</th>
                <th class="note-col">비고</th>
              </tr>
            </thead>
            <tbody>
              ${day.items.map(item => `
                <tr>
                  <td class="time-col">${item.time}</td>
                  <td class="activity-col">
                    <span class="status ${
                      item.status === '✅' ? 'status-confirmed' :
                      item.status === '🔜' ? 'status-pending' : 'status-cancelled'
                    }">${item.status}</span>
                    <strong>${item.activity}</strong><br>
                    <small>${item.location}</small>
                    ${item.duration ? `<br><small>소요시간: ${item.duration}</small>` : ''}
                    ${item.transportation ? `<br><small>이동: ${item.transportation}</small>` : ''}
                    ${item.cost > 0 ? `<br><span class="cost">${formatCurrency(item.cost)}</span>` : ''}
                  </td>
                  <td class="note-col">${item.note || '-'}</td>
                </tr>
              `).join('')}
              <tr class="total-cost">
                <td colspan="2"><strong>일일 총 비용</strong></td>
                <td><strong>${formatCurrency(day.totalCost)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      `).join('')}

      <!-- 식사 요약 -->
      ${plan.mealSummary && plan.mealSummary.length > 0 ? `
        <div class="section page-break">
          <div class="section-title">🍽️ 식사 요약</div>
          <table class="overview-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>식당명</th>
                <th>상태</th>
                <th>예상 비용</th>
              </tr>
            </thead>
            <tbody>
              ${plan.mealSummary.map(meal => `
                <tr>
                  <td>${meal.day} ${meal.meal}</td>
                  <td><strong>${meal.restaurant}</strong></td>
                  <td>${meal.status}</td>
                  <td class="cost">${formatCurrency(meal.cost)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- 비용 분석 -->
      ${plan.costBreakdown ? `
        <div class="section">
          <div class="section-title">💰 비용 분석</div>
          <table class="overview-table">
            <thead>
              <tr>
                <th>항목</th>
                <th>금액</th>
                <th>비율</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>교통비</td>
                <td>${formatCurrency(plan.costBreakdown.transportation)}</td>
                <td>${((plan.costBreakdown.transportation / plan.costBreakdown.total) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td>숙박비</td>
                <td>${formatCurrency(plan.costBreakdown.accommodation)}</td>
                <td>${((plan.costBreakdown.accommodation / plan.costBreakdown.total) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td>식비</td>
                <td>${formatCurrency(plan.costBreakdown.meals)}</td>
                <td>${((plan.costBreakdown.meals / plan.costBreakdown.total) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td>액티비티</td>
                <td>${formatCurrency(plan.costBreakdown.activities)}</td>
                <td>${((plan.costBreakdown.activities / plan.costBreakdown.total) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td>기타</td>
                <td>${formatCurrency(plan.costBreakdown.others)}</td>
                <td>${((plan.costBreakdown.others / plan.costBreakdown.total) * 100).toFixed(1)}%</td>
              </tr>
              <tr class="total-cost">
                <td><strong>총 비용</strong></td>
                <td><strong>${formatCurrency(plan.costBreakdown.total)}</strong></td>
                <td><strong>100%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- 여행 팁 -->
      ${plan.tips && plan.tips.length > 0 ? `
        <div class="section">
          <div class="section-title">💡 여행 팁</div>
          ${plan.tips.map(tip => `
            <div class="tip-item">• ${tip}</div>
          `).join('')}
        </div>
      ` : ''}

      <!-- 준비사항 -->
      ${plan.requirements && plan.requirements.length > 0 ? `
        <div class="section">
          <div class="section-title">📋 준비사항</div>
          ${plan.requirements.map(req => `
            <div class="requirement-item">• ${req}</div>
          `).join('')}
        </div>
      ` : ''}

      <!-- 응급 연락처 -->
      ${plan.emergencyInfo ? `
        <div class="emergency-info">
          <div class="section-title">🚨 응급 연락처</div>
          <div><strong>병원:</strong> ${plan.emergencyInfo.hospital}</div>
          <div><strong>경찰서:</strong> ${plan.emergencyInfo.police}</div>
          ${plan.emergencyInfo.embassy ? `<div><strong>영사관:</strong> ${plan.emergencyInfo.embassy}</div>` : ''}
        </div>
      ` : ''}

    </body>
    </html>
  `;
}

// 다운로드 트리거 함수
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 브라우저 프린트 함수
export function printTravelPlan(plan: TravelPlan) {
  const htmlContent = generateHTMLTemplate(plan, false);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('팝업이 차단되었습니다. 팝업을 허용하고 다시 시도해주세요.');
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  printWindow.focus();
  printWindow.print();
  
  setTimeout(() => {
    printWindow.close();
  }, 1000);
}