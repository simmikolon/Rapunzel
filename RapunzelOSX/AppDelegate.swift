//
//  AppDelegate.swift
//  RapunzelOSX
//
//  Created by Simon Kemper on 10.05.16.
//  Copyright (c) 2016 Simon Kemper. All rights reserved.
//


import Cocoa
import SpriteKit

@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {
    
    @IBOutlet weak var window: NSWindow!
    @IBOutlet weak var skView: SKView!
    
    var sceneManager: SceneManager!
    
    func applicationDidFinishLaunching(_ aNotification: Notification) {

        let keyboardInputSource = KeyboardInputSource()
        let inputManager = InputManager(nativeControlInputSource: keyboardInputSource)
        
        sceneManager = SceneManager(presentingView: skView, inputManager: inputManager)
        sceneManager.transitionToSceneWithSceneIdentifier(.home)
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}
