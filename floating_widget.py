#!/usr/bin/env python3
"""
Shrimpin' Floating Desktop Widget
Always-on-top overlay that works system-wide
"""

import sys
import time
import requests
import threading
import objc
from Foundation import *
from AppKit import *
from WebKit import *

class ShrimpinWidget(NSObject):
    def init(self):
        self = objc.super(ShrimpinWidget, self).init()
        if self is None:
            return None

        # Create window
        self.window = NSWindow.alloc().initWithContentRect_styleMask_backing_defer_(
            NSMakeRect(100, 100, 260, 360),
            NSWindowStyleMaskBorderless,  # Frameless (no title bar)
            NSBackingStoreBuffered,
            False
        )

        # Configure window
        self.window.setLevel_(NSStatusWindowLevel)  # Always on top (higher than floating)
        self.window.setOpaque_(False)
        self.window.setBackgroundColor_(NSColor.clearColor())
        self.window.setMovableByWindowBackground_(True)  # Draggable
        self.window.setHasShadow_(True)  # Keep shadow for depth
        self.window.setIgnoresMouseEvents_(False)  # Can interact
        self.window.setCollectionBehavior_(
            NSWindowCollectionBehaviorCanJoinAllSpaces |
            NSWindowCollectionBehaviorStationary |
            NSWindowCollectionBehaviorFullScreenAuxiliary  # Show even in fullscreen
        )

        # Create web view
        web_config = WKWebViewConfiguration.alloc().init()
        self.web_view = WKWebView.alloc().initWithFrame_configuration_(
            NSMakeRect(0, 0, 260, 360),
            web_config
        )

        # Load widget HTML
        html_path = os.path.join(os.path.expanduser("~/Shrimpin"), "desktop_widget.html")
        url = NSURL.fileURLWithPath_(html_path)
        self.web_view.loadFileURL_allowingReadAccessToURL_(url, url.URLByDeletingLastPathComponent())

        # Add web view to window
        self.window.contentView().addSubview_(self.web_view)

        # Show window
        self.window.makeKeyAndOrderFront_(None)

        return self

def main():
    app = NSApplication.sharedApplication()

    # Create widget
    widget = ShrimpinWidget.alloc().init()

    # Set activation policy to accessory (no dock icon)
    app.setActivationPolicy_(NSApplicationActivationPolicyAccessory)

    # Run app
    print("🦐 Shrimpin' Widget is floating!")
    print("Press Ctrl+C to quit")
    app.run()

if __name__ == '__main__':
    import os
    main()
