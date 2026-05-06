"""
Shrimpin' Desktop Widget
Floating overlay that works system-wide (not just in browser)
"""

import tkinter as tk
from tkinter import Canvas
from PIL import Image, ImageTk
import requests
import threading
import time

# Configuration
BACKEND_URL = "http://localhost:8765/status"
POLL_INTERVAL = 0.5  # seconds
WIDGET_WIDTH = 260
WIDGET_HEIGHT = 300

class ShrimpinWidget:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Shrimpin' Detector")

        # Make window frameless and always on top
        self.root.overrideredirect(True)
        self.root.attributes('-topmost', True)

        # Set window size
        self.root.geometry(f"{WIDGET_WIDTH}x{WIDGET_HEIGHT}+100+100")

        # Try to make background transparent (macOS)
        try:
            self.root.attributes('-transparent', True)
            self.bg_color = 'systemTransparent'
        except:
            self.bg_color = '#0f172a'

        self.root.configure(bg=self.bg_color)

        # State
        self.current_frame = 0
        self.dragging = False
        self.drag_start_x = 0
        self.drag_start_y = 0

        # Load images
        try:
            self.shrimp1 = ImageTk.PhotoImage(Image.open("shrimp1.png").resize((120, 120), Image.Resampling.LANCZOS))
            self.shrimp2 = ImageTk.PhotoImage(Image.open("shrimp2.png").resize((120, 120), Image.Resampling.LANCZOS))
        except Exception as e:
            print(f"Error loading images: {e}")
            self.shrimp1 = None
            self.shrimp2 = None

        # Create UI
        self.create_ui()

        # Bind dragging
        self.canvas.bind('<Button-1>', self.start_drag)
        self.canvas.bind('<B1-Motion>', self.on_drag)
        self.canvas.bind('<ButtonRelease-1>', self.stop_drag)

        # Start polling backend
        self.polling = True
        self.poll_thread = threading.Thread(target=self.poll_backend, daemon=True)
        self.poll_thread.start()

        # Start animation
        self.animate_shrimp()

    def create_ui(self):
        # Main canvas with rounded rectangle background
        self.canvas = Canvas(
            self.root,
            width=WIDGET_WIDTH,
            height=WIDGET_HEIGHT,
            bg=self.bg_color,
            highlightthickness=0
        )
        self.canvas.pack(fill='both', expand=True)

        # Background rounded rectangle
        self.bg_rect = self.canvas.create_rectangle(
            10, 10, WIDGET_WIDTH-10, WIDGET_HEIGHT-10,
            fill='#1e293b',
            outline='#334155',
            width=2,
            tags='bg'
        )

        # Brand header
        self.canvas.create_text(
            WIDGET_WIDTH//2, 35,
            text="🦐 Shrimpin'",
            font=('SF Pro Display', 16, 'bold'),
            fill='#E8734A',
            tags='brand'
        )

        # Shrimp image
        if self.shrimp1:
            self.shrimp_img = self.canvas.create_image(
                WIDGET_WIDTH//2, 130,
                image=self.shrimp1,
                tags='shrimp'
            )

        # Counter background
        self.canvas.create_rectangle(
            40, 200, WIDGET_WIDTH-40, 245,
            fill='#0f172a',
            outline='#334155',
            width=1,
            tags='counter_bg'
        )

        # Counter text
        self.counter_text = self.canvas.create_text(
            WIDGET_WIDTH//2, 215,
            text="0",
            font=('SF Mono', 32, 'bold'),
            fill='#f5f0e8',
            tags='counter'
        )

        # Counter label
        self.canvas.create_text(
            WIDGET_WIDTH//2, 235,
            text="slouches",
            font=('Inter', 10, 'normal'),
            fill='#64748b',
            tags='label'
        )

        # Status bar background
        self.canvas.create_rectangle(
            30, 260, WIDGET_WIDTH-30, 285,
            fill='#0a0f1a',
            outline='#1e293b',
            width=1,
            tags='status_bg'
        )

        # Status dot
        self.status_dot = self.canvas.create_oval(
            40, 267, 50, 277,
            fill='#666666',
            outline='',
            tags='status_dot'
        )

        # Status message
        self.status_text = self.canvas.create_text(
            65, 272,
            text="Connecting...",
            font=('Inter', 11, 'normal'),
            fill='#94a3b8',
            anchor='w',
            tags='status'
        )

    def animate_shrimp(self):
        """Animate between shrimp frames"""
        if not self.shrimp1 or not self.shrimp2:
            self.root.after(600, self.animate_shrimp)
            return

        if self.current_frame == 0:
            self.canvas.itemconfig(self.shrimp_img, image=self.shrimp2)
            self.current_frame = 1
        else:
            self.canvas.itemconfig(self.shrimp_img, image=self.shrimp1)
            self.current_frame = 0

        self.root.after(600, self.animate_shrimp)

    def poll_backend(self):
        """Poll Python backend for posture data"""
        while self.polling:
            try:
                response = requests.get(BACKEND_URL, timeout=1)
                data = response.json()

                # Update UI on main thread
                self.root.after(0, self.update_ui, data)

            except Exception as e:
                # Backend offline
                self.root.after(0, self.update_ui_offline)

            time.sleep(POLL_INTERVAL)

    def update_ui(self, data):
        """Update UI with backend data"""
        # Update counter
        count = data.get('count', 0)
        self.canvas.itemconfig(self.counter_text, text=str(count))

        # Update status
        if not data.get('calibrated', False):
            progress = int(data.get('cal_progress', 0) * 100)
            countdown = data.get('countdown', 0)
            if countdown > 0:
                msg = f"Sit straight... {int(countdown)}"
            else:
                msg = f"Calibrating {progress}%"
            self.canvas.itemconfig(self.status_text, text=msg)
            self.canvas.itemconfig(self.status_dot, fill='#FFC107')
        elif data.get('is_hunching', False):
            self.canvas.itemconfig(self.status_text, text="Straighten up!")
            self.canvas.itemconfig(self.status_dot, fill='#E8734A')
        else:
            self.canvas.itemconfig(self.status_text, text="Good posture")
            self.canvas.itemconfig(self.status_dot, fill='#4CAF50')

    def update_ui_offline(self):
        """Update UI when backend is offline"""
        self.canvas.itemconfig(self.status_text, text="Backend offline")
        self.canvas.itemconfig(self.status_dot, fill='#F44336')

    def start_drag(self, event):
        """Start dragging window"""
        self.dragging = True
        self.drag_start_x = event.x
        self.drag_start_y = event.y

    def on_drag(self, event):
        """Handle window drag"""
        if self.dragging:
            x = self.root.winfo_x() + (event.x - self.drag_start_x)
            y = self.root.winfo_y() + (event.y - self.drag_start_y)
            self.root.geometry(f"+{x}+{y}")

    def stop_drag(self, event):
        """Stop dragging"""
        self.dragging = False

    def run(self):
        """Start the widget"""
        self.root.mainloop()
        self.polling = False

if __name__ == "__main__":
    print("🦐 Starting Shrimpin' Desktop Widget...")
    print("Make sure the Python backend (posture_detector.py) is running!")

    widget = ShrimpinWidget()
    widget.run()
