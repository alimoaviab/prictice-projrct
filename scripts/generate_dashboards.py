import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def get_font(bold=False, size=12):
    try:
        if bold:
            return ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", size)
        else:
            return ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", size)
    except IOError:
        return ImageFont.load_default()

# Color Palette (Strictly Blue & White)
WHITE = (255, 255, 255, 255)
BG_SLATE_50 = (248, 250, 252, 255)
BG_SLATE_100 = (241, 245, 249, 255)
BORDER_SLATE_200 = (226, 232, 240, 255)
TEXT_SLATE_400 = (148, 163, 184, 255)
TEXT_SLATE_600 = (71, 85, 105, 255)
TEXT_SLATE_900 = (15, 23, 42, 255)

BLUE_600 = (37, 99, 235, 255)      # Primary Brand Blue (bg-blue-600)
BLUE_400 = (96, 165, 250, 255)     # Medium Accent Blue
BLUE_100 = (219, 234, 254, 255)    # Light Blue
BLUE_50 = (239, 246, 255, 255)      # Soft Blue Bg
BLUE_TRANSPARENT = (37, 99, 235, 30) # 12% Opacity Blue for fills

def draw_base_layout(draw, title, active_tab_index):
    draw.rectangle([0, 0, 1000, 625], fill=BG_SLATE_50)

def create_analytics_dashboard(path):
    img = Image.new("RGBA", (1000, 625), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw_base_layout(draw, "Analytics & Trends", 0)
    
    card_width = 226
    card_height = 80
    gap = 16
    metrics = [
        {"title": "TOTAL STUDENTS", "value": "1,450", "badge": "+4.2%"},
        {"title": "DAILY ATTENDANCE", "value": "94.5%", "badge": "+0.8%"},
        {"title": "FEE COLLECTION", "value": "87.4%", "badge": "Active"},
        {"title": "ACTIVE CLASSES", "value": "32", "badge": "Grade 1-12"}
    ]
    
    for i, met in enumerate(metrics):
        x = 24 + i * (card_width + gap)
        y = 24
        draw.rounded_rectangle([x, y, x + card_width, y + card_height], radius=12, fill=WHITE, outline=BORDER_SLATE_200, width=1)
        draw.text((x + 14, y + 14), met["title"], fill=TEXT_SLATE_400, font=get_font(bold=True, size=9))
        draw.text((x + 14, y + 36), met["value"], fill=TEXT_SLATE_900, font=get_font(bold=True, size=22))
        draw.rounded_rectangle([x + card_width - 64, y + 14, x + card_width - 12, y + 30], radius=4, fill=BLUE_50)
        draw.text((x + card_width - 58, y + 17), met["badge"], fill=BLUE_600, font=get_font(bold=True, size=9))
        
    chart_x1 = 24
    chart_y1 = 120
    chart_x2 = 648
    chart_y2 = 601
    draw.rounded_rectangle([chart_x1, chart_y1, chart_x2, chart_y2], radius=16, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.text((chart_x1 + 20, chart_y1 + 20), "Enrollment & Admission Growth", fill=TEXT_SLATE_900, font=get_font(bold=True, size=14))
    draw.text((chart_x1 + 20, chart_y1 + 38), "Student admissions trend compared to target threshold", fill=TEXT_SLATE_400, font=get_font(bold=False, size=11))
    
    draw.ellipse([chart_x2 - 170, chart_y1 + 26, chart_x2 - 162, chart_y1 + 34], fill=BORDER_SLATE_200)
    draw.text((chart_x2 - 154, chart_y1 + 22), "Target", fill=TEXT_SLATE_600, font=get_font(bold=False, size=11))
    draw.ellipse([chart_x2 - 95, chart_y1 + 26, chart_x2 - 87, chart_y1 + 34], fill=BLUE_600)
    draw.text((chart_x2 - 79, chart_y1 + 22), "Actual", fill=BLUE_600, font=get_font(bold=True, size=11))
    
    grid_y_start = chart_y1 + 120
    for grid_i in range(5):
        y_val = grid_y_start + grid_i * 65
        draw.line([chart_x1 + 50, y_val, chart_x2 - 30, y_val], fill=BG_SLATE_100, width=1)
        lbl = str(1600 - grid_i * 200)
        draw.text((chart_x1 + 18, y_val - 6), lbl, fill=TEXT_SLATE_400, font=get_font(bold=False, size=9))
        
    months = ["Sep", "Nov", "Jan", "Mar", "May", "Jul"]
    for mi, m in enumerate(months):
        x_val = chart_x1 + 60 + mi * 100
        draw.text((x_val - 10, chart_y2 - 35), m, fill=TEXT_SLATE_400, font=get_font(bold=False, size=9))
        
    points = [
        (chart_x1 + 60, grid_y_start + 234),
        (chart_x1 + 160, grid_y_start + 195),
        (chart_x1 + 260, grid_y_start + 156),
        (chart_x1 + 360, grid_y_start + 117),
        (chart_x1 + 460, grid_y_start + 78),
        (chart_x1 + 560, grid_y_start + 39)
    ]
    poly_points = [(chart_x1 + 60, grid_y_start + 260)] + points + [(chart_x1 + 560, grid_y_start + 260)]
    draw.polygon(poly_points, fill=BLUE_TRANSPARENT)
    draw.line(points, fill=BLUE_600, width=4)
    for pt in points[:-1]:
        draw.ellipse([pt[0]-4, pt[1]-4, pt[0]+4, pt[1]+4], fill=WHITE, outline=BLUE_600, width=2)
    draw.ellipse([points[-1][0]-6, points[-1][1]-6, points[-1][0]+6, points[-1][1]+6], fill=BLUE_600, outline=WHITE, width=2)
    
    target_points = [
        (chart_x1 + 60, grid_y_start + 208),
        (chart_x1 + 160, grid_y_start + 188),
        (chart_x1 + 260, grid_y_start + 169),
        (chart_x1 + 360, grid_y_start + 149),
        (chart_x1 + 460, grid_y_start + 130),
        (chart_x1 + 560, grid_y_start + 110)
    ]
    for tj_i in range(len(target_points) - 1):
        pt1 = target_points[tj_i]
        pt2 = target_points[tj_i + 1]
        draw.line([pt1[0], pt1[1], pt2[0], pt2[1]], fill=TEXT_SLATE_400, width=2)
        
    tooltip_x = points[-1][0] - 100
    tooltip_y = points[-1][1] - 40
    draw.rounded_rectangle([tooltip_x, tooltip_y, tooltip_x + 90, tooltip_y + 30], radius=6, fill=TEXT_SLATE_900)
    draw.text((tooltip_x + 8, tooltip_y + 4), "Jul Count", fill=TEXT_SLATE_400, font=get_font(bold=False, size=8))
    draw.text((tooltip_x + 8, tooltip_y + 14), "1,450 (+4.2%)", fill=WHITE, font=get_font(bold=True, size=9))
    
    side_x1 = 664
    side_x2 = 976
    
    ar_y1 = 120
    ar_y2 = 345
    draw.rounded_rectangle([side_x1, ar_y1, side_x2, ar_y2], radius=16, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.text((side_x1 + 20, ar_y1 + 16), "Attendance Rates", fill=TEXT_SLATE_900, font=get_font(bold=True, size=13))
    
    levels = [
        {"name": "Primary School Level", "val": "96.8%", "w": 263},
        {"name": "Middle School Level", "val": "93.5%", "w": 254},
        {"name": "High School Level", "val": "94.1%", "w": 256}
    ]
    for li, lvl in enumerate(levels):
        ly = ar_y1 + 48 + li * 44
        draw.text((side_x1 + 20, ly), lvl["name"], fill=TEXT_SLATE_600, font=get_font(bold=False, size=11))
        draw.text((side_x2 - 55, ly), lvl["val"], fill=BLUE_600, font=get_font(bold=True, size=11))
        draw.rounded_rectangle([side_x1 + 20, ly + 18, side_x2 - 20, ly + 23], radius=3, fill=BG_SLATE_100)
        draw.rounded_rectangle([side_x1 + 20, ly + 18, side_x1 + 20 + lvl["w"], ly + 23], radius=3, fill=BLUE_600)
        
    gr_y1 = 361
    gr_y2 = 601
    draw.rounded_rectangle([side_x1, gr_y1, side_x2, gr_y2], radius=16, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.text((side_x1 + 20, gr_y1 + 16), "Gender Ratio", fill=TEXT_SLATE_900, font=get_font(bold=True, size=13))
    
    cx = side_x1 + 80
    cy = gr_y1 + 115
    rad = 45
    draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=BG_SLATE_100, width=12)
    draw.pieslice([cx - rad, cy - rad, cx + rad, cy + rad], start=-90, end=122, fill=None, outline=BLUE_600, width=12)
    draw.ellipse([cx - rad + 6, cy - rad + 6, cx + rad - 6, cy + rad - 6], fill=WHITE)
    draw.text((cx - 12, cy - 14), "59%", fill=TEXT_SLATE_900, font=get_font(bold=True, size=13))
    draw.text((cx - 13, cy + 3), "BOYS", fill=TEXT_SLATE_400, font=get_font(bold=False, size=8))
    
    legend_x = side_x1 + 160
    draw.rounded_rectangle([legend_x, gr_y1 + 75, legend_x + 10, gr_y1 + 85], radius=3, fill=BLUE_600)
    draw.text((legend_x + 16, gr_y1 + 72), "Boys (59%)", fill=TEXT_SLATE_600, font=get_font(bold=True, size=11))
    draw.rounded_rectangle([legend_x, gr_y1 + 100, legend_x + 10, gr_y1 + 110], radius=3, fill=BLUE_100)
    draw.text((legend_x + 16, gr_y1 + 97), "Girls (41%)", fill=TEXT_SLATE_600, font=get_font(bold=True, size=11))
    draw.text((legend_x, gr_y1 + 130), "Total Enrolled: 1,450", fill=TEXT_SLATE_400, font=get_font(bold=False, size=10))

    img.convert("RGB").save(path, "PNG")

def create_admin_dashboard(path):
    img = Image.new("RGBA", (1000, 625), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw_base_layout(draw, "Admin Dashboard", 1)
    
    gap = 10
    card_width = 150
    card_height = 70
    kpis = [
        {"title": "STUDENTS", "val": "1,450", "badge": "S"},
        {"title": "TEACHERS", "val": "86", "badge": "T"},
        {"title": "CLASSES", "val": "32", "badge": "C"},
        {"title": "ATTENDANCE", "val": "94.5%", "badge": "A"},
        {"title": "FEES %", "val": "87.4%", "badge": "F"},
        {"title": "PENDING", "val": "PKR 124K", "badge": "P"}
    ]
    
    for i, kp in enumerate(kpis):
        x = 25 + i * (card_width + gap)
        y = 24
        draw.rounded_rectangle([x, y, x + card_width, y + card_height], radius=10, fill=WHITE, outline=BORDER_SLATE_200, width=1)
        draw.text((x + 10, y + 10), kp["title"], fill=TEXT_SLATE_400, font=get_font(bold=True, size=8))
        draw.text((x + 10, y + 36), kp["val"], fill=TEXT_SLATE_900, font=get_font(bold=True, size=16))
        draw.ellipse([x + card_width - 24, y + 8, x + card_width - 8, y + 24], fill=BLUE_50)
        draw.text((x + card_width - 18, y + 10), kp["badge"], fill=BLUE_600, font=get_font(bold=True, size=9))
        
    track_y = 110
    draw.rounded_rectangle([24, track_y, 976, track_y + 40], radius=10, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.rounded_rectangle([36, track_y + 8, 60, track_y + 32], radius=6, fill=BLUE_600)
    draw.text((44, track_y + 11), "✓", fill=WHITE, font=get_font(bold=True, size=12))
    draw.text((72, track_y + 8), "Attendance Tracker", fill=TEXT_SLATE_900, font=get_font(bold=True, size=11))
    draw.text((72, track_y + 22), "30 of 32 classes marked today", fill=TEXT_SLATE_400, font=get_font(bold=False, size=9))
    
    draw.rounded_rectangle([450, track_y + 18, 830, track_y + 23], radius=3, fill=BG_SLATE_100)
    draw.rounded_rectangle([450, track_y + 18, 806, track_y + 23], radius=3, fill=BLUE_600)
    draw.text((845, track_y + 13), "93.7%", fill=BLUE_600, font=get_font(bold=True, size=11))
    draw.text((956, track_y + 13), "Details", fill=BLUE_600, font=get_font(bold=True, size=10), anchor="rs")
    
    col1_x1 = 24
    col1_x2 = 492
    col2_x1 = 508
    col2_x2 = 976
    
    ta_y1 = 166
    ta_y2 = 360
    draw.rounded_rectangle([col1_x1, ta_y1, col1_x2, ta_y2], radius=16, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.text((col1_x1 + 18, ta_y1 + 16), "TODAY'S ATTENDANCE", fill=TEXT_SLATE_400, font=get_font(bold=True, size=10))
    
    p_x1 = col1_x1 + 18
    p_x2 = p_x1 + 200
    p_y1 = ta_y1 + 45
    p_y2 = p_y1 + 60
    draw.rounded_rectangle([p_x1, p_y1, p_x2, p_y2], radius=10, fill=BLUE_50, outline=BLUE_100, width=1)
    draw.text((p_x1 + 12, p_y1 + 10), "Present", fill=BLUE_600, font=get_font(bold=True, size=11))
    draw.text((p_x1 + 12, p_y1 + 28), "1,374 Students", fill=TEXT_SLATE_900, font=get_font(bold=True, size=18))
    
    a_x1 = col1_x2 - 218
    a_x2 = col1_x2 - 18
    draw.rounded_rectangle([a_x1, p_y1, a_x2, p_y2], radius=10, fill=BG_SLATE_50, outline=BORDER_SLATE_200, width=1)
    draw.text((a_x1 + 12, p_y1 + 10), "Absent", fill=TEXT_SLATE_600, font=get_font(bold=True, size=11))
    draw.text((a_x1 + 12, p_y1 + 28), "76 Students", fill=TEXT_SLATE_900, font=get_font(bold=True, size=18))
    
    draw.rounded_rectangle([col1_x1 + 18, ta_y2 - 54, col1_x2 - 18, ta_y2 - 18], radius=8, fill=BLUE_600)
    draw.text((col1_x1 + 234, ta_y2 - 42), "Mark Daily Attendance", fill=WHITE, font=get_font(bold=True, size=11), anchor="ms")
    
    todo_y1 = 376
    todo_y2 = 601
    draw.rounded_rectangle([col1_x1, todo_y1, col1_x2, todo_y2], radius=16, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.text((col1_x1 + 18, todo_y1 + 16), "THINGS TO DO", fill=TEXT_SLATE_400, font=get_font(bold=True, size=10))
    
    tasks = [
        {"title": "Pending Student Fees Ledger", "count": "14"},
        {"title": "Staff & Teacher Leave Requests", "count": "3"},
        {"title": "Unmarked Classes Attendance Today", "count": "2"}
    ]
    for ti, tsk in enumerate(tasks):
        ty = todo_y1 + 45 + ti * 50
        draw.text((col1_x1 + 18, ty + 10), tsk["title"], fill=TEXT_SLATE_600, font=get_font(bold=True, size=11))
        draw.ellipse([col1_x2 - 48, ty + 6, col1_x2 - 20, ty + 34], fill=BLUE_50)
        draw.text((col1_x2 - 38, ty + 12), tsk["count"], fill=BLUE_600, font=get_font(bold=True, size=11))
        if ti < 2:
            draw.line([col1_x1 + 18, ty + 42, col1_x2 - 18, ty + 42], fill=BG_SLATE_50, width=1)
            
    right_y1 = 166
    right_y2 = 601
    draw.rounded_rectangle([col2_x1, right_y1, col2_x2, right_y2], radius=16, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.text((col2_x1 + 18, right_y1 + 16), "RECENT LOGS & UPDATES", fill=TEXT_SLATE_400, font=get_font(bold=True, size=10))
    
    logs = [
        {"action": "Fee payment recorded", "detail": "Class 10-A · PKR 12,000", "time": "2m ago", "icon": "F"},
        {"action": "Attendance updated", "detail": "Class 6-B · actor: admin@mail", "time": "12m ago", "icon": "A"},
        {"action": "Live class scheduled", "detail": "Grade 9-A · Physics Lecture", "time": "45m ago", "icon": "L"},
        {"action": "Student profile created", "detail": "Reg #2026-0044 · Ali Khan", "time": "1h ago", "icon": "S"},
        {"action": "Exam grades posted", "detail": "Grade 10-A Math Midterm", "time": "3h ago", "icon": "E"},
        {"action": "Access Role Authorized", "detail": "Teacher portal active logs", "time": "5h ago", "icon": "R"}
    ]
    
    for li, lg in enumerate(logs):
        ly = right_y1 + 45 + li * 60
        draw.rounded_rectangle([col2_x1 + 18, ly, col2_x1 + 46, ly + 28], radius=6, fill=BLUE_50)
        draw.text((col2_x1 + 28, ly + 6), lg["icon"], fill=BLUE_600, font=get_font(bold=True, size=12))
        draw.text((col2_x1 + 58, ly), lg["action"], fill=TEXT_SLATE_900, font=get_font(bold=True, size=11))
        draw.text((col2_x1 + 58, ly + 14), lg["detail"], fill=TEXT_SLATE_600, font=get_font(bold=False, size=9))
        draw.text((col2_x2 - 65, ly + 4), lg["time"], fill=TEXT_SLATE_400, font=get_font(bold=False, size=10))
        if li < 5:
            draw.line([col2_x1 + 18, ly + 40, col2_x2 - 18, ly + 40], fill=BG_SLATE_50, width=1)

    img.convert("RGB").save(path, "PNG")

def create_students_dashboard(path):
    img = Image.new("RGBA", (1000, 625), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw_base_layout(draw, "Student Records", 2)
    
    stat_w = 306
    stat_h = 60
    stat_labels = [
        {"title": "TOTAL ENROLLED", "val": "1,450 Students"},
        {"title": "ACTIVE STATUS", "val": "1,412 Active"},
        {"title": "ON ACADEMIC LEAVE", "val": "38 On Leave"}
    ]
    for si, st in enumerate(stat_labels):
        x = 24 + si * (stat_w + 17)
        y = 24
        draw.rounded_rectangle([x, y, x + stat_w, y + stat_h], radius=10, fill=WHITE, outline=BORDER_SLATE_200, width=1)
        draw.text((x + 14, y + 10), st["title"], fill=TEXT_SLATE_400, font=get_font(bold=True, size=8))
        draw.text((x + 14, y + 28), st["val"], fill=TEXT_SLATE_900, font=get_font(bold=True, size=15))
        
    filter_y = 100
    draw.rounded_rectangle([24, filter_y, 712, filter_y + 40], radius=8, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.text((38, filter_y + 12), "🔍  Search students by name, registration ID or class...", fill=TEXT_SLATE_400, font=get_font(bold=False, size=11))
    draw.rounded_rectangle([728, filter_y, 976, filter_y + 40], radius=8, fill=BLUE_600)
    draw.text((785, filter_y + 12), "+ Add New Student", fill=WHITE, font=get_font(bold=True, size=11))
    
    tbl_x1 = 24
    tbl_x2 = 648
    tbl_y1 = 156
    tbl_y2 = 601
    draw.rounded_rectangle([tbl_x1, tbl_y1, tbl_x2, tbl_y2], radius=16, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    
    draw.text((tbl_x1 + 45, tbl_y1 + 16), "REG ID", fill=TEXT_SLATE_400, font=get_font(bold=True, size=10))
    draw.text((tbl_x1 + 140, tbl_y1 + 16), "STUDENT NAME", fill=TEXT_SLATE_400, font=get_font(bold=True, size=10))
    draw.text((tbl_x1 + 340, tbl_y1 + 16), "CLASS", fill=TEXT_SLATE_400, font=get_font(bold=True, size=10))
    draw.text((tbl_x1 + 470, tbl_y1 + 16), "STATUS", fill=TEXT_SLATE_400, font=get_font(bold=True, size=10))
    draw.line([tbl_x1 + 18, tbl_y1 + 40, tbl_x2 - 18, tbl_y1 + 40], fill=BG_SLATE_100, width=1)
    
    students = [
        {"id": "2026-0044", "name": "Ali Khan", "class": "Class 10-A", "status": "Active"},
        {"id": "2026-0045", "name": "Ayesha Ahmed", "class": "Class 9-B", "status": "Active"},
        {"id": "2026-0046", "name": "Bilal Mustafa", "class": "Class 10-A", "status": "On Leave"},
        {"id": "2026-0047", "name": "Fatima Raza", "class": "Class 8-C", "status": "Active"},
        {"id": "2026-0048", "name": "Hamza Yusuf", "class": "Class 11-B", "status": "Active"}
    ]
    
    for row_i, stud in enumerate(students):
        ry = tbl_y1 + 50 + row_i * 65
        draw.rounded_rectangle([tbl_x1 + 18, ry + 10, tbl_x1 + 30, ry + 22], radius=2, fill=WHITE, outline=BORDER_SLATE_200, width=1)
        draw.text((tbl_x1 + 45, ry + 12), stud["id"], fill=TEXT_SLATE_900, font=get_font(bold=True, size=11))
        draw.text((tbl_x1 + 140, ry + 12), stud["name"], fill=TEXT_SLATE_900, font=get_font(bold=True, size=12))
        draw.text((tbl_x1 + 340, ry + 12), stud["class"], fill=TEXT_SLATE_600, font=get_font(bold=False, size=11))
        pill_fill = BLUE_50 if stud["status"] == "Active" else BG_SLATE_100
        pill_txt = BLUE_600 if stud["status"] == "Active" else TEXT_SLATE_600
        draw.rounded_rectangle([tbl_x1 + 470, ry + 8, tbl_x1 + 540, ry + 26], radius=5, fill=pill_fill)
        draw.text((tbl_x1 + 482, ry + 11), stud["status"], fill=pill_txt, font=get_font(bold=True, size=10))
        if row_i < len(students) - 1:
            draw.line([tbl_x1 + 18, ry + 42, tbl_x2 - 18, ry + 42], fill=BG_SLATE_100, width=1)
            
    prof_x1 = 664
    prof_x2 = 976
    prof_y1 = 156
    prof_y2 = 601
    draw.rounded_rectangle([prof_x1, prof_y1, prof_x2, prof_y2], radius=16, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    
    cx = prof_x1 + (prof_x2 - prof_x1)//2
    draw.ellipse([cx - 32, prof_y1 + 25, cx + 32, prof_y1 + 89], fill=BLUE_600)
    draw.text((cx, prof_y1 + 48), "AK", fill=WHITE, font=get_font(bold=True, size=18), anchor="ms")
    draw.text((cx, prof_y1 + 105), "Ali Khan", fill=TEXT_SLATE_900, font=get_font(bold=True, size=15), anchor="ms")
    draw.text((cx, prof_y1 + 120), "Registration ID: 2026-0044", fill=TEXT_SLATE_400, font=get_font(bold=False, size=10), anchor="ms")
    
    details = [
        {"label": "Class Enrollment", "val": "Grade 10-A"},
        {"label": "Parent Contact", "val": "0300-1234567"},
        {"label": "Attendance Rate", "val": "98.2%"},
        {"label": "Monthly Fees Status", "val": "Paid"}
    ]
    
    for di, det in enumerate(details):
        dy = prof_y1 + 145 + di * 48
        draw.text((prof_x1 + 18, dy), det["label"], fill=TEXT_SLATE_400, font=get_font(bold=False, size=10))
        val_color = BLUE_600 if det["val"] == "Paid" else TEXT_SLATE_900
        draw.text((prof_x1 + 18, dy + 15), det["val"], fill=val_color, font=get_font(bold=True, size=12))
        if di < 3:
            draw.line([prof_x1 + 18, dy + 38, prof_x2 - 18, dy + 38], fill=BG_SLATE_50, width=1)
            
    draw.rounded_rectangle([prof_x1 + 18, prof_y2 - 50, prof_x2 - 18, prof_y2 - 18], radius=8, fill=BLUE_50)
    draw.text((cx, prof_y2 - 38), "View Academic Ledger", fill=BLUE_600, font=get_font(bold=True, size=11), anchor="ms")

    img.convert("RGB").save(path, "PNG")

def create_security_dashboard(path):
    img = Image.new("RGBA", (1000, 625), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw_base_layout(draw, "Access Control & Permissions", 3)
    
    roles = ["Super Admin", "Admin", "Teacher Role (Active)", "Student Role", "Parent Role"]
    tab_x = 24
    tab_y = 24
    for ri, rl in enumerate(roles):
        is_active = (ri == 2)
        tw = len(rl) * 7 + 24
        if is_active:
            draw.rounded_rectangle([tab_x, tab_y, tab_x + tw, tab_y + 32], radius=6, fill=BLUE_600)
            draw.text((tab_x + 12, tab_y + 9), rl, fill=WHITE, font=get_font(bold=True, size=11))
        else:
            draw.rounded_rectangle([tab_x, tab_y, tab_x + tw, tab_y + 32], radius=6, fill=WHITE, outline=BORDER_SLATE_200, width=1)
            draw.text((tab_x + 12, tab_y + 9), rl, fill=TEXT_SLATE_600, font=get_font(bold=False, size=11))
        tab_x += tw + 10
        
    left_x1 = 24
    left_x2 = 648
    right_x1 = 664
    right_x2 = 976
    main_y = 72
    
    draw.rounded_rectangle([left_x1, main_y, left_x2, 601], radius=16, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.text((left_x1 + 18, main_y + 16), "TEACHER ROLE PERMISSIONS", fill=TEXT_SLATE_900, font=get_font(bold=True, size=13))
    draw.text((left_x1 + 18, main_y + 45), "MODULE NAME", fill=TEXT_SLATE_400, font=get_font(bold=True, size=10))
    draw.text((left_x1 + 350, main_y + 45), "READ", fill=TEXT_SLATE_400, font=get_font(bold=True, size=10))
    draw.text((left_x1 + 440, main_y + 45), "WRITE", fill=TEXT_SLATE_400, font=get_font(bold=True, size=10))
    draw.text((left_x1 + 530, main_y + 45), "DELETE", fill=TEXT_SLATE_400, font=get_font(bold=True, size=10))
    draw.line([left_x1 + 18, main_y + 65, left_x2 - 18, main_y + 65], fill=BG_SLATE_100, width=1)
    
    modules = [
        {"name": "Dashboard Overview", "r": True, "w": False, "d": False},
        {"name": "Student Profiles & Directory", "r": True, "w": False, "d": False},
        {"name": "Daily Attendance Tracking", "r": True, "w": True, "d": False},
        {"name": "Fee Ledger & Billing Info", "r": False, "w": False, "d": False},
        {"name": "Exams & Results Posting", "r": True, "w": True, "d": True},
        {"name": "System Configurations", "r": False, "w": False, "d": False}
    ]
    
    for mi, mod in enumerate(modules):
        my = main_y + 75 + mi * 70
        draw.text((left_x1 + 18, my + 14), mod["name"], fill=TEXT_SLATE_900, font=get_font(bold=True, size=12))
        
        def draw_checkbox(x, state):
            if state:
                draw.rounded_rectangle([x, my + 10, x + 20, my + 30], radius=4, fill=BLUE_600)
                draw.line([x + 5, my + 20, x + 9, my + 24], fill=WHITE, width=2)
                draw.line([x + 9, my + 24, x + 15, my + 15], fill=WHITE, width=2)
            else:
                draw.rounded_rectangle([x, my + 10, x + 20, my + 30], radius=4, fill=WHITE, outline=BORDER_SLATE_200, width=1)
                
        draw_checkbox(left_x1 + 350, mod["r"])
        draw_checkbox(left_x1 + 440, mod["w"])
        draw_checkbox(left_x1 + 530, mod["d"])
        
        if mi < len(modules) - 1:
            draw.line([left_x1 + 18, my + 54, left_x2 - 18, my + 54], fill=BG_SLATE_100, width=1)
            
    draw.rounded_rectangle([right_x1, main_y, right_x2, 601], radius=16, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.text((right_x1 + 18, main_y + 16), "SECURITY AUDIT LOGS", fill=TEXT_SLATE_900, font=get_font(bold=True, size=12))
    
    sec_logs = [
        {"event": "Permissions Updated", "user": "admin@eduplexo.com", "time": "10m ago"},
        {"event": "Access Key Revoked", "user": "support@eduplexo.com", "time": "1h ago"},
        {"event": "Custom Role Created", "user": "super@eduplexo.com", "time": "3h ago"},
        {"event": "Failed Admin Login", "user": "182.164.22.8", "time": "4h ago"},
        {"event": "Settings Mutation", "user": "admin@eduplexo.com", "time": "1d ago"}
    ]
    
    for li, lg in enumerate(sec_logs):
        ly = main_y + 48 + li * 90
        is_fail = ("failed" in lg["event"].lower())
        badge_color = BLUE_600 if not is_fail else BLUE_400
        draw.rounded_rectangle([right_x1 + 18, ly, right_x1 + 24, ly + 40], radius=3, fill=badge_color)
        draw.text((right_x1 + 32, ly), lg["event"], fill=TEXT_SLATE_900, font=get_font(bold=True, size=11))
        draw.text((right_x1 + 32, ly + 14), lg["user"], fill=TEXT_SLATE_600, font=get_font(bold=False, size=9))
        draw.text((right_x1 + 32, ly + 26), lg["time"], fill=TEXT_SLATE_400, font=get_font(bold=False, size=9))
        if li < len(sec_logs) - 1:
            draw.line([right_x1 + 18, ly + 65, right_x2 - 18, ly + 65], fill=BG_SLATE_50, width=1)

    img.convert("RGB").save(path, "PNG")

def create_ai_dashboard(path):
    img = Image.new("RGBA", (1000, 625), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw_base_layout(draw, "Plexa AI Agent", 4)
    
    main_x1 = 24
    main_x2 = 976
    main_y1 = 24
    main_y2 = 601
    
    draw.rounded_rectangle([main_x1, main_y1, main_x2, main_y2], radius=16, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    
    draw.rounded_rectangle([main_x1, main_y1, main_x2, main_y1 + 55], radius=16, fill=BLUE_50)
    draw.ellipse([main_x1 + 18, main_y1 + 12, main_x1 + 50, main_y1 + 44], fill=BLUE_600)
    draw.text((main_x1 + 26, main_y1 + 19), "AI", fill=WHITE, font=get_font(bold=True, size=13))
    draw.text((main_x1 + 62, main_y1 + 12), "Plexa AI Virtual Command Agent", fill=TEXT_SLATE_900, font=get_font(bold=True, size=13))
    draw.ellipse([main_x1 + 62, main_y1 + 34, main_x1 + 68, main_y1 + 40], fill=BLUE_600)
    draw.text((main_x1 + 74, main_y1 + 30), "Integrated with school relational data structures · Response time ~12ms", fill=TEXT_SLATE_600, font=get_font(bold=False, size=9))
    
    msg1_x1 = main_x2 - 380
    msg1_x2 = main_x2 - 18
    msg1_y1 = main_y1 + 75
    msg1_y2 = msg1_y1 + 45
    draw.rounded_rectangle([msg1_x1, msg1_y1, msg1_x2, msg1_y2], radius=10, fill=BLUE_600)
    draw.text((msg1_x1 + 14, msg1_y1 + 8), "Show me the fee collection rate for Class 10-A", fill=WHITE, font=get_font(bold=False, size=11))
    draw.text((msg1_x1 + 14, msg1_y1 + 23), "and compare it to last month's rates.", fill=WHITE, font=get_font(bold=False, size=11))
    
    msg2_x1 = main_x1 + 18
    msg2_x2 = main_x1 + 440
    msg2_y1 = main_y1 + 130
    msg2_y2 = msg2_y1 + 50
    draw.rounded_rectangle([msg2_x1, msg2_y1, msg2_x2, msg2_y2], radius=10, fill=BG_SLATE_50, outline=BORDER_SLATE_200, width=1)
    draw.text((msg2_x1 + 14, msg2_y1 + 8), "Plexa AI: Class 10-A current fee collection is at 92.4%,", fill=TEXT_SLATE_900, font=get_font(bold=False, size=11))
    draw.text((msg2_x1 + 14, msg2_y1 + 23), "which is up 4.2% from last month. Detailed breakdown:", fill=TEXT_SLATE_900, font=get_font(bold=False, size=11))
    
    chart_y = msg2_y2 + 8
    draw.rounded_rectangle([msg2_x1, chart_y, msg2_x2, chart_y + 115], radius=10, fill=BG_SLATE_50, outline=BORDER_SLATE_200, width=1)
    draw.text((msg2_x1 + 14, chart_y + 12), "Fee Collection Comparison - Class 10-A", fill=TEXT_SLATE_900, font=get_font(bold=True, size=11))
    draw.text((msg2_x1 + 14, chart_y + 36), "Current Month (92.4%)", fill=TEXT_SLATE_600, font=get_font(bold=False, size=10))
    draw.rounded_rectangle([msg2_x1 + 14, chart_y + 50, msg2_x1 + 350, chart_y + 56], radius=3, fill=BLUE_600)
    draw.text((msg2_x1 + 14, chart_y + 68), "Last Month (88.2%)", fill=TEXT_SLATE_600, font=get_font(bold=False, size=10))
    draw.rounded_rectangle([msg2_x1 + 14, chart_y + 82, msg2_x1 + 310, chart_y + 88], radius=3, fill=BLUE_100)
    
    msg3_x1 = main_x2 - 340
    msg3_x2 = main_x2 - 18
    msg3_y1 = chart_y + 130
    msg3_y2 = msg3_y1 + 32
    draw.rounded_rectangle([msg3_x1, msg3_y1, msg3_x2, msg3_y2], radius=10, fill=BLUE_600)
    draw.text((msg3_x1 + 14, msg3_y1 + 8), "Are there any pending leave requests?", fill=WHITE, font=get_font(bold=False, size=11))
    
    msg4_x1 = main_x1 + 18
    msg4_x2 = main_x1 + 440
    msg4_y1 = msg3_y2 + 8
    msg4_y2 = msg4_y1 + 48
    draw.rounded_rectangle([msg4_x1, msg4_y1, msg4_x2, msg4_y2], radius=10, fill=BG_SLATE_50, outline=BORDER_SLATE_200, width=1)
    draw.text((msg4_x1 + 14, msg4_y1 + 8), "Plexa AI: Yes, there are 3 pending leave requests from teachers.", fill=TEXT_SLATE_900, font=get_font(bold=False, size=11))
    draw.text((msg4_x1 + 14, msg4_y1 + 23), "Would you like me to display details or approve them?", fill=TEXT_SLATE_900, font=get_font(bold=False, size=11))
    
    chips = ["Check fee anomalies", "Report low attendance", "List high performers"]
    chip_x = main_x1 + 18
    chip_y = main_y2 - 95
    for cp in chips:
        cp_w = len(cp) * 6 + 24
        draw.rounded_rectangle([chip_x, chip_y, chip_x + cp_w, chip_y + 26], radius=13, fill=WHITE, outline=BLUE_600, width=1)
        draw.text((chip_x + 12, chip_y + 6), cp, fill=BLUE_600, font=get_font(bold=True, size=10))
        chip_x += cp_w + 10
        
    input_y = main_y2 - 55
    draw.rounded_rectangle([main_x1 + 18, input_y, main_x2 - 18, input_y + 40], radius=8, fill=BG_SLATE_50, outline=BORDER_SLATE_200, width=1)
    draw.text((main_x1 + 32, input_y + 12), "Ask Plexa AI anything about school registers, records or fee metrics...", fill=TEXT_SLATE_400, font=get_font(bold=False, size=11))
    draw.rounded_rectangle([main_x2 - 50, input_y + 6, main_x2 - 24, input_y + 34], radius=6, fill=BLUE_600)
    draw.text((main_x2 - 41, input_y + 9), "→", fill=WHITE, font=get_font(bold=True, size=14))

    img.convert("RGB").save(path, "PNG")

# Render role preview images (size 600 x 320)
def create_role_admin_preview(path):
    img = Image.new("RGBA", (600, 320), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Background slate
    draw.rectangle([0, 0, 600, 320], fill=BG_SLATE_50)
    
    # Left Box: Campuses Tree (x in [16, 292], width = 276)
    draw.rounded_rectangle([16, 16, 292, 304], radius=10, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.text((28, 28), "CAMPUSES", fill=TEXT_SLATE_400, font=get_font(bold=True, size=8))
    
    branches = [
        "Maple Elementary",
        "Oak High School",
        "Pine Middle School",
        "Elm Vocational Centre"
    ]
    for bi, br in enumerate(branches):
        by = 46 + bi * 36
        draw.rounded_rectangle([28, by + 4, 40, by + 16], radius=2, fill=WHITE, outline=BLUE_600, width=1)
        draw.line([31, by + 10, 34, by + 13], fill=BLUE_600, width=2)
        draw.line([34, by + 13, 38, by + 7], fill=BLUE_600, width=2)
        draw.text((48, by + 5), br, fill=TEXT_SLATE_900, font=get_font(bold=True, size=10))
        
    draw.rounded_rectangle([28, 218, 280, 240], radius=4, fill=BG_SLATE_50)
    draw.text((36, 223), "STAFF ROLES", fill=TEXT_SLATE_600, font=get_font(bold=True, size=9))
    
    # Right Box: Daily Operations Overview (x in [308, 584], width = 276)
    draw.rounded_rectangle([308, 16, 584, 304], radius=10, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.text((320, 28), "DAILY OPERATIONS OVERVIEW", fill=TEXT_SLATE_400, font=get_font(bold=True, size=8))
    
    # Total Enrolment card
    draw.rounded_rectangle([320, 46, 572, 116], radius=8, fill=BLUE_50, outline=BLUE_100, width=1)
    draw.text((330, 54), "1. Total Enrolment", fill=TEXT_SLATE_600, font=get_font(bold=True, size=9))
    draw.text((330, 68), "1,450", fill=TEXT_SLATE_900, font=get_font(bold=True, size=18))
    draw.text((330, 94), "(+4.2%) compared to last month", fill=BLUE_600, font=get_font(bold=False, size=8))
    
    # Active Staff
    draw.rounded_rectangle([320, 124, 572, 194], radius=8, fill=BG_SLATE_50, outline=BORDER_SLATE_200, width=1)
    draw.text((330, 132), "2. Active Staff", fill=TEXT_SLATE_600, font=get_font(bold=True, size=9))
    draw.text((330, 146), "128", fill=TEXT_SLATE_900, font=get_font(bold=True, size=18))
    draw.text((330, 172), "96% Present today", fill=TEXT_SLATE_400, font=get_font(bold=False, size=8))
    
    # Recent log
    draw.text((320, 208), "🔔 RECENT TASKS & ALERTS", fill=TEXT_SLATE_900, font=get_font(bold=True, size=9))
    draw.text((320, 226), "Campus Safety Audit - pending", fill=TEXT_SLATE_600, font=get_font(bold=False, size=9))
    draw.text((320, 242), "New Staff Onboarding - complete", fill=TEXT_SLATE_400, font=get_font(bold=False, size=9))
    draw.text((320, 258), "Data Sync Status - Successful", fill=BLUE_600, font=get_font(bold=True, size=9))
    
    img.convert("RGB").save(path, "PNG")

def create_role_teacher_preview(path):
    img = Image.new("RGBA", (600, 320), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([0, 0, 600, 320], fill=BG_SLATE_50)
    
    # Content Card (x in [16, 584], y in [16, 304])
    draw.rounded_rectangle([16, 16, 584, 304], radius=10, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.text((32, 28), "Attendance & Grades", fill=TEXT_SLATE_900, font=get_font(bold=True, size=12))
    
    # Class Selection row
    draw.text((32, 57), "CLASS:", fill=TEXT_SLATE_400, font=get_font(bold=True, size=8))
    draw.rounded_rectangle([72, 52, 242, 72], radius=4, fill=BG_SLATE_50, outline=BORDER_SLATE_200, width=1)
    draw.text((80, 57), "Period 1 - Algebra I (Ms. Anderson)  ▼", fill=TEXT_SLATE_900, font=get_font(bold=True, size=9))
    
    draw.text((262, 57), "DATE:", fill=TEXT_SLATE_400, font=get_font(bold=True, size=8))
    draw.rounded_rectangle([297, 52, 422, 72], radius=4, fill=BG_SLATE_50, outline=BORDER_SLATE_200, width=1)
    draw.text((305, 57), "Tuesday, Oct 26, 2026", fill=TEXT_SLATE_600, font=get_font(bold=False, size=9))
    
    draw.rounded_rectangle([482, 52, 568, 72], radius=4, fill=BLUE_600)
    draw.text((491, 57), "Mark All Present", fill=WHITE, font=get_font(bold=True, size=9))
    
    # Table headers
    draw.text((32, 90), "Student Name", fill=TEXT_SLATE_400, font=get_font(bold=True, size=9))
    draw.text((252, 90), "Attendance", fill=TEXT_SLATE_400, font=get_font(bold=True, size=9))
    draw.text((402, 90), "Grade", fill=TEXT_SLATE_400, font=get_font(bold=True, size=9))
    draw.line([32, 105, 568, 105], fill=BG_SLATE_100, width=1)
    
    students = [
        {"name": "Emily Carter", "reg": "10023", "present": True, "grade": "A (92%)"},
        {"name": "Liam Nguyen", "reg": "10024", "present": True, "grade": "B+ (88%)"},
        {"name": "Sarah Johnson", "reg": "10025", "present": False, "grade": "B- (77%)"},
        {"name": "Ben Adams", "reg": "10028", "present": True, "grade": "B (84%)"},
        {"name": "Chloe Miller", "reg": "10029", "present": True, "grade": "C (70%)"}
    ]
    
    for row_i, stud in enumerate(students):
        ry = 112 + row_i * 34
        draw.text((32, ry), stud["name"], fill=TEXT_SLATE_900, font=get_font(bold=True, size=10))
        draw.text((32, ry + 12), stud["reg"], fill=TEXT_SLATE_400, font=get_font(bold=False, size=8))
        
        # Attendance pill
        att_fill = BLUE_50 if stud["present"] else BG_SLATE_100
        att_color = BLUE_600 if stud["present"] else TEXT_SLATE_400
        att_text = "Present" if stud["present"] else "Absent"
        draw.rounded_rectangle([252, ry + 2, 307, ry + 18], radius=4, fill=att_fill)
        draw.text((262, ry + 5), att_text, fill=att_color, font=get_font(bold=True, size=9))
        
        draw.text((402, ry + 4), stud["grade"], fill=TEXT_SLATE_900, font=get_font(bold=True, size=10))
        if row_i < len(students) - 1:
            draw.line([32, ry + 27, 568, ry + 27], fill=BG_SLATE_50, width=1)
            
    img.convert("RGB").save(path, "PNG")

def create_role_parent_preview(path):
    img = Image.new("RGBA", (600, 320), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([0, 0, 600, 320], fill=BG_SLATE_50)
    
    col1_x1 = 16
    col1_x2 = 292
    col2_x1 = 308
    col2_x2 = 584
    card_y = 16
    
    # Left Card: Billing & Fees
    draw.rounded_rectangle([col1_x1, card_y, col1_x2, 304], radius=10, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.text((col1_x1 + 16, card_y + 16), "Fee Payment & Billing", fill=TEXT_SLATE_900, font=get_font(bold=True, size=12))
    
    draw.rounded_rectangle([col1_x1 + 16, card_y + 44, col1_x2 - 16, card_y + 98], radius=8, fill=BLUE_50)
    draw.text((col1_x1 + 26, card_y + 54), "CURRENT INVOICE PENDING", fill=BLUE_600, font=get_font(bold=True, size=8))
    draw.text((col1_x1 + 26, card_y + 68), "PKR 12,000", fill=TEXT_SLATE_900, font=get_font(bold=True, size=20))
    
    draw.text((col1_x1 + 16, card_y + 114), "Due Date: May 30, 2026", fill=TEXT_SLATE_600, font=get_font(bold=False, size=10))
    draw.text((col1_x1 + 16, card_y + 130), "Student Reg ID: 2026-0044", fill=TEXT_SLATE_400, font=get_font(bold=False, size=9))
    
    # Big Blue Payment Action Button
    draw.rounded_rectangle([col1_x1 + 16, card_y + 156, col1_x2 - 16, card_y + 196], radius=8, fill=BLUE_600)
    draw.text((col1_x1 + 66, card_y + 170), "Pay School Fees Online", fill=WHITE, font=get_font(bold=True, size=11))
    
    # Mini ledger statement at bottom
    draw.text((col1_x1 + 16, card_y + 218), "Receipt: #2026-R099 (PKR 12,000 Paid)", fill=TEXT_SLATE_400, font=get_font(bold=False, size=9))
    draw.text((col1_x1 + 16, card_y + 236), "Invoice Date: May 01, 2026", fill=TEXT_SLATE_400, font=get_font(bold=False, size=9))
    
    # Right Card: Academic Overview & Grades
    draw.rounded_rectangle([col2_x1, card_y, col2_x2, 304], radius=10, fill=WHITE, outline=BORDER_SLATE_200, width=1)
    draw.text((col2_x1 + 16, card_y + 16), "Child's Academic Progress", fill=TEXT_SLATE_900, font=get_font(bold=True, size=12))
    
    # Stats circles/boxes
    draw.rounded_rectangle([col2_x1 + 16, card_y + 44, col2_x1 + 126, card_y + 92], radius=8, fill=BG_SLATE_50)
    draw.text((col2_x1 + 24, card_y + 52), "ATTENDANCE", fill=TEXT_SLATE_400, font=get_font(bold=True, size=8))
    draw.text((col2_x1 + 24, card_y + 66), "98.2%", fill=BLUE_600, font=get_font(bold=True, size=16))
    
    draw.rounded_rectangle([col2_x2 - 126, card_y + 44, col2_x2 - 16, card_y + 92], radius=8, fill=BG_SLATE_50)
    draw.text((col2_x2 - 118, card_y + 52), "GRADE AVERAGE", fill=TEXT_SLATE_400, font=get_font(bold=True, size=8))
    draw.text((col2_x2 - 118, card_y + 66), "A- (89.5%)", fill=TEXT_SLATE_900, font=get_font(bold=True, size=16))
    
    # Bullet points / recent grades
    draw.text((col2_x1 + 16, card_y + 114), "📚 RECENT EXAMS & MARKS", fill=TEXT_SLATE_900, font=get_font(bold=True, size=9))
    
    grades_info = [
        {"subject": "Mathematics (Midterm Exam)", "score": "94/100 (A)"},
        {"subject": "Physics Laboratory Report", "score": "88/100 (B+)"},
        {"subject": "English Lit Essay Submission", "score": "91/100 (A)"},
        {"subject": "Attendance Mark Today", "score": "Present"}
    ]
    
    for gi, gd in enumerate(grades_info):
        gy = card_y + 130 + gi * 34
        draw.text((col2_x1 + 16, gy), gd["subject"], fill=TEXT_SLATE_600, font=get_font(bold=False, size=9))
        val_clr = BLUE_600 if gd["score"] == "Present" else TEXT_SLATE_900
        draw.text((col2_x2 - 110, gy), gd["score"], fill=val_clr, font=get_font(bold=True, size=9))
        if gi < 3:
            draw.line([col2_x1 + 16, gy + 20, col2_x2 - 16, gy + 20], fill=BG_SLATE_50, width=1)

    img.convert("RGB").save(path, "PNG")

def wrap_in_shadow_card(content_img_path, card_w=930, card_h=581):
    # Keep the raw dashboard screenshot directly at its native resolution (edge-to-edge).
    return

if __name__ == "__main__":
    public_dir = "/Users/butt/Desktop/eduplexo/landing-app/public"
    os.makedirs(public_dir, exist_ok=True)
    
    print("Generating Analytics Dashboard...")
    analytics_path = os.path.join(public_dir, "analytics-preview.png")
    create_analytics_dashboard(analytics_path)
    wrap_in_shadow_card(analytics_path, card_w=930, card_h=581)
    
    print("Generating Admin Dashboard...")
    admin_path = os.path.join(public_dir, "admin-preview.png")
    create_admin_dashboard(admin_path)
    wrap_in_shadow_card(admin_path, card_w=930, card_h=581)
    
    print("Generating Students Dashboard...")
    students_path = os.path.join(public_dir, "students-preview.png")
    create_students_dashboard(students_path)
    wrap_in_shadow_card(students_path, card_w=930, card_h=581)
    
    print("Generating Security Dashboard...")
    security_path = os.path.join(public_dir, "security-preview.png")
    create_security_dashboard(security_path)
    wrap_in_shadow_card(security_path, card_w=930, card_h=581)
    
    print("Generating AI Dashboard...")
    ai_path = os.path.join(public_dir, "ai-preview.png")
    create_ai_dashboard(ai_path)
    wrap_in_shadow_card(ai_path, card_w=930, card_h=581)
    
    print("Generating Role Admin Preview...")
    role_admin_path = os.path.join(public_dir, "role-admin-preview.png")
    create_role_admin_preview(role_admin_path)
    wrap_in_shadow_card(role_admin_path, card_w=900, card_h=480)
    
    print("Generating Role Teacher Preview...")
    role_teacher_path = os.path.join(public_dir, "role-teacher-preview.png")
    create_role_teacher_preview(role_teacher_path)
    wrap_in_shadow_card(role_teacher_path, card_w=900, card_h=480)
    
    print("Generating Role Parent Preview...")
    role_parent_path = os.path.join(public_dir, "role-parent-preview.png")
    create_role_parent_preview(role_parent_path)
    wrap_in_shadow_card(role_parent_path, card_w=900, card_h=480)
    
    print("All dashboard and role previews generated successfully in landing-app/public/ !")
