import type { CalendarEvent } from '../types';

/**
 * Unfolds lines in an ICS file.
 * According to RFC 5545, long lines are split with CRLF followed by a single space or tab.
 */
function unfoldICS(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const unfolded: string[] = [];

  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.substring(1);
    } else {
      unfolded.push(line);
    }
  }

  return unfolded;
}

/**
 * Parses an iCalendar date string:
 * e.g. "20260925T073000Z", "20260925T143000", "20260925", "TZID=Asia/Ho_Chi_Minh:20260925T073000"
 */
function parseICSDate(dateStr: string): { date: string; time: string; isAllDay: boolean } {
  // Strip params like TZID=... or VALUE=DATE:
  const value = dateStr.includes(':') ? dateStr.split(':').pop() || '' : dateStr;
  const clean = value.trim();

  if (clean.length === 8 && /^\d{8}$/.test(clean)) {
    // All day event: YYYYMMDD
    const yyyy = clean.substring(0, 4);
    const mm = clean.substring(4, 6);
    const dd = clean.substring(6, 8);
    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: '00:00',
      isAllDay: true,
    };
  }

  // DateTime format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?/);
  if (match) {
    const [, yyyy, mm, dd, hh, min] = match;
    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
      isAllDay: false,
    };
  }

  // Fallback to today
  const now = new Date();
  return {
    date: now.toISOString().split('T')[0],
    time: '08:00',
    isAllDay: false,
  };
}

/**
 * Clean escaped characters in text (e.g. \, \n, \;)
 */
function cleanText(text: string): string {
  return text
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

/**
 * Parses Google Calendar .ics file content into CalendarEvent list
 */
export function parseICS(icsContent: string): CalendarEvent[] {
  const lines = unfoldICS(icsContent);
  const events: CalendarEvent[] = [];

  let inEvent = false;
  let currentEvent: Partial<CalendarEvent> = {};
  let eventIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {
        id: `cal_event_${Date.now()}_${eventIndex++}`,
      };
      continue;
    }

    if (trimmed === 'END:VEVENT') {
      if (currentEvent.title && currentEvent.date) {
        // Compute day of week (0=Sun, 1=Mon, ..., 6=Sat)
        const d = new Date(currentEvent.date + 'T12:00:00');
        const dayOfWeek = isNaN(d.getTime()) ? new Date().getDay() : d.getDay();

        events.push({
          id: currentEvent.id || `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: currentEvent.title,
          description: currentEvent.description || '',
          location: currentEvent.location || '',
          startTime: currentEvent.startTime || '08:00',
          endTime: currentEvent.endTime || '09:30',
          date: currentEvent.date,
          dayOfWeek,
          isAllDay: currentEvent.isAllDay || false,
          recurrence: currentEvent.recurrence || undefined,
        });
      }
      inEvent = false;
      currentEvent = {};
      continue;
    }

    if (!inEvent) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const keyPart = trimmed.substring(0, colonIndex).toUpperCase();
    const valPart = trimmed.substring(colonIndex + 1);

    if (keyPart === 'SUMMARY' || keyPart.startsWith('SUMMARY;')) {
      currentEvent.title = cleanText(valPart);
    } else if (keyPart === 'DESCRIPTION' || keyPart.startsWith('DESCRIPTION;')) {
      currentEvent.description = cleanText(valPart);
    } else if (keyPart === 'LOCATION' || keyPart.startsWith('LOCATION;')) {
      currentEvent.location = cleanText(valPart);
    } else if (keyPart === 'DTSTART' || keyPart.startsWith('DTSTART;')) {
      const parsed = parseICSDate(trimmed);
      currentEvent.date = parsed.date;
      currentEvent.startTime = parsed.time;
      currentEvent.isAllDay = parsed.isAllDay;
    } else if (keyPart === 'DTEND' || keyPart.startsWith('DTEND;')) {
      const parsed = parseICSDate(trimmed);
      currentEvent.endTime = parsed.time;
    } else if (keyPart === 'RRULE') {
      currentEvent.recurrence = valPart.trim();
    } else if (keyPart === 'UID') {
      currentEvent.id = valPart.trim() || currentEvent.id;
    }
  }

  // Sort events chronologically by date and start time
  events.sort((a, b) => {
    const compDate = a.date.localeCompare(b.date);
    if (compDate !== 0) return compDate;
    return a.startTime.localeCompare(b.startTime);
  });

  return events;
}

/**
 * Parses Google Calendar JSON export if user uploads a JSON file
 */
export function parseCalendarJSON(jsonContent: string): CalendarEvent[] {
  try {
    const data = JSON.parse(jsonContent);
    const items = Array.isArray(data) ? data : data.items || [];
    const events: CalendarEvent[] = [];

    items.forEach((item: Record<string, unknown>, idx: number) => {
      const title = (item.summary || item.title || item.name || 'Lịch học') as string;
      const startObj = (item.start || {}) as Record<string, string>;
      const endObj = (item.end || {}) as Record<string, string>;

      const startRaw = startObj.dateTime || startObj.date || (item.startTime as string) || '';
      const endRaw = endObj.dateTime || endObj.date || (item.endTime as string) || '';

      const parsedStart = parseICSDate(startRaw);
      const parsedEnd = parseICSDate(endRaw);

      events.push({
        id: (item.id as string) || `json_event_${Date.now()}_${idx}`,
        title,
        description: (item.description as string) || '',
        location: (item.location as string) || '',
        date: parsedStart.date,
        startTime: parsedStart.time,
        endTime: parsedEnd.time,
        isAllDay: !startRaw.includes('T'),
      });
    });

    return events;
  } catch (error) {
    throw new Error('Định dạng tệp JSON không hợp lệ');
  }
}

/**
 * Generate a realistic demo student schedule for instant testing
 */
export function getDemoStudentSchedule(): CalendarEvent[] {
  const today = new Date();
  const format = (d: Date) => d.toISOString().split('T')[0];

  const days: { offset: number; title: string; start: string; end: string; loc: string; desc: string }[] = [
    {
      offset: 0, // Today
      title: 'Lập trình Web & Ứng dụng Di động (Thực hành)',
      start: '07:30',
      end: '09:45',
      loc: 'Phòng Lab A3-204 (Tòa nhà Công nghệ)',
      desc: 'Giảng viên: TS. Trần Văn Minh. Yêu cầu: Mang laptop cá nhân & chuẩn bị môi trường React/Node.js.',
    },
    {
      offset: 0, // Today
      title: 'Cơ sở Dữ liệu Nâng cao & Tối ưu hóa Truy vấn',
      start: '10:00',
      end: '11:45',
      loc: 'Giảng đường C1-102',
      desc: 'Chương 4: Indexing, Transactions và ACID trong hệ thống NoSQL/RDBMS.',
    },
    {
      offset: 0, // Today
      title: 'Tiếng Anh Học thuật & Thuyết trình Chuyên ngành',
      start: '13:30',
      end: '15:15',
      loc: 'Phòng B2-305',
      desc: 'Bài tập: Thuyết trình 5 phút về giải pháp công nghệ đám mây.',
    },
    {
      offset: 1, // Tomorrow
      title: 'Cấu trúc Dữ liệu & Giải thuật (Tree & Graph)',
      start: '08:00',
      end: '10:15',
      loc: 'Phòng Học A1-401',
      desc: 'Luyện tập giải bài tập tìm kiếm theo chiều sâu (DFS) và chiều rộng (BFS).',
    },
    {
      offset: 1, // Tomorrow
      title: 'Họp Nhóm Đồ án Học kỳ: CarinaTaskPlus',
      start: '14:00',
      end: '16:00',
      loc: 'Khu tự học Thư viện Trung tâm / Google Meet',
      desc: 'Thống nhất tính năng Cloud Storage, Lịch Google Calendar và triển khai Firebase.',
    },
    {
      offset: 2,
      title: 'Mạng Máy tính & An toàn Thông tin',
      start: '07:30',
      end: '09:45',
      loc: 'Phòng Lab B4-101',
      desc: 'Thực hành cấu hình tường lửa, subnetting và mã hóa SSL/TLS.',
    },
    {
      offset: 3,
      title: 'Toán Rời rạc & Lý thuyết Đồ thị',
      start: '09:00',
      end: '11:15',
      loc: 'Giảng đường B1-201',
      desc: 'Ôn tập chuẩn bị cho bài kiểm tra giữa kỳ tuần sau.',
    },
    {
      offset: 4,
      title: 'Thể dục & Rèn luyện Thể chất (Bóng rổ / Chạy bộ)',
      start: '16:00',
      end: '17:30',
      loc: 'Sân Vận động Trường',
      desc: 'Rèn luyện sức bền và giãn cơ sau các giờ học lập trình.',
    },
  ];

  return days.map((item, idx) => {
    const d = new Date();
    d.setDate(today.getDate() + item.offset);
    return {
      id: `demo_event_${idx}_${item.offset}`,
      title: item.title,
      description: item.desc,
      location: item.loc,
      date: format(d),
      startTime: item.start,
      endTime: item.end,
      dayOfWeek: d.getDay(),
      isAllDay: false,
    };
  });
}
