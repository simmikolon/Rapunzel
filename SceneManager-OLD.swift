//
//  SceneManager.swift
//  Rapunzel
//
//  Created by Simon Kemper on 18.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

#if os(OSX)
    import AppKit
#else
    import UIKit
#endif

final class SceneManager: InputSourceGameStateDelegate {
    
    /// Platform specific notifications about the app becoming inactive.
    var pauseNotificationNames: [String] {
        #if os(OSX)
            return [
                NSApplicationWillResignActiveNotification,
                NSWindowDidMiniaturizeNotification
            ]
        #else
            return [
                UIApplicationWillResignActiveNotification,
                UIApplicationWillEnterForegroundNotification
            ]
        #endif
    }
    
    // MARK: Convenience
    
    func registerForPauseNotifications() {
        for notificationName in pauseNotificationNames {
            NSNotificationCenter.defaultCenter().addObserver(self, selector: #selector(SceneManager.pauseGameNotification), name: notificationName, object: nil)
        }
    }
    
    @objc func pauseGameNotification() {
        gameScene.paused = true
        presentingView.presentScene(pauseScene)
    }
    
    func unregisterForPauseNotifications() {
        for notificationName in pauseNotificationNames {
            NSNotificationCenter.defaultCenter().removeObserver(self, name: notificationName, object: nil)
        }
    }

    let presentingView: SKView
    
    lazy var gameScene: GameScene = {
        let screenSize = CGSize(width: 768, height: 1364)
        let gameScene = GameScene(size: screenSize)
        gameScene.scaleMode = .AspectFit
        gameScene.sceneManager = self
        return gameScene
    }()
    
    lazy var pauseScene: PauseScene = {
        let screenSize = CGSize(width: 768, height: 1364)
        let pauseScene = PauseScene(size: screenSize)
        pauseScene.scaleMode = .AspectFit
        pauseScene.sceneManager = self
        return pauseScene
    }()
    
    lazy var inputManager: InputManager = {
       
        let inputManager = InputManager()
        return inputManager
    }()
    
    init(withPresentingView view: SKView) {
        
        presentingView = view
        presentingView.showsFPS = true
        presentingView.showsNodeCount = true
        presentingView.ignoresSiblingOrder = true
        presentingView.presentScene(gameScene)
        
        #if os(OSX)
            
            let keyboardInputSource = KeyboardInputSource()
            keyboardInputSource.gameStateDelegate = self
            
            gameScene.keyEventForwardingDelegate = keyboardInputSource
            pauseScene.keyEventForwardingDelegate = keyboardInputSource
            inputManager.inputSources.append(keyboardInputSource)
            
        #elseif os(iOS)
            
            let touchInputSource = TouchInputSource()
            touchInputSource.gameStateDelegate = self
            
            let motionInputSource = MotionInputSource()
            
            gameScene.touchEventForwardingDelegate = touchInputSource
            pauseScene.touchEventForwardingDelegate = touchInputSource
            inputManager.inputSources.append(motionInputSource)
            inputManager.inputSources.append(touchInputSource)
            
        #endif
        
        registerForPauseNotifications()
    }
    
    func inputSourceDidTogglePauseState(controlInputSource: InputSource) {
        
        gameScene.paused = true
        presentingView.presentScene(pauseScene)
    }
    
    func inputSourceDidToggleResumeState(controlInputSource: InputSource) {
        
        presentingView.presentScene(gameScene)
    }
}
