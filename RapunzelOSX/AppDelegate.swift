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
    
    func applicationDidFinishLaunching(aNotification: NSNotification) {
        
        let screenSize = CGSize(width: 768, height: 1364)
        let gameScene = RPGameScene(size: screenSize)
        
        skView.showsFPS = true
        skView.showsNodeCount = true
        skView.ignoresSiblingOrder = true
        
        gameScene.scaleMode = .AspectFit
        gameScene.setup()
        
        skView.presentScene(gameScene)
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(sender: NSApplication) -> Bool {
        return true
    }
}