//
//  GameScene.swift
//  Rapunzel
//
//  Created by Simon Kemper on 18.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

#if os(OSX)
    import AppKit
#else
    import UIKit
#endif

extension GameScene {
    // MARK: Properties
    
    /**
     The scene's `paused` property is set automatically when the
     app enters the background. Override to check if an `overlay` node is
     being presented to determine if the game should be paused.
     */
    override var paused: Bool {
        
        get {
            
            return super.paused
        }
        
        set {
            
            super.paused = newValue
            
            if super.paused {
                stateMachine.enterState(GameScenePauseState.self)
            }
            else {
                
            }
        }
    }
    
    /// Platform specific notifications about the app becoming inactive.
    var pauseNotificationNames: [String] {
        #if os(OSX)
            return [
                NSApplicationWillResignActiveNotification,
                NSWindowDidMiniaturizeNotification
            ]
        #else
            return [
                UIApplicationWillResignActiveNotification
            ]
        #endif
    }
    
    // MARK: Convenience
    
    /**
     Register for notifications about the app becoming inactive in
     order to pause the game.
     */
    func registerForPauseNotifications() {
        for notificationName in pauseNotificationNames {
            NSNotificationCenter.defaultCenter().addObserver(self, selector: #selector(GameScene.pauseGame), name: notificationName, object: nil)
        }
    }
    
    func pauseGame() {
        paused = true
        stateMachine.enterState(GameScenePauseState.self)
    }
    
    func unregisterForPauseNotifications() {
        for notificationName in pauseNotificationNames {
            NSNotificationCenter.defaultCenter().removeObserver(self, name: notificationName, object: nil)
        }
    }

}