//
//  GameSceneDidMoveToViewState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 10.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

class GameSceneDidMoveToViewState: GameSceneState {

    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        
        if previousState is GameScenePauseState {
            
            gameScene.stateMachine.enter(GameScenePlayingState.self)
            
        } else {
            
            setupScene()
        }
    }
    
    func setupScene() {
        
        gameScene.physicsWorld.contactDelegate = gameScene.contactDelegate
        gameScene.backgroundColor = SKColor(red: 30/255, green: 60/255, blue: 63/255, alpha: 1)
        gameScene.anchorPoint = CGPoint(x: 0.5, y: 0)
        gameScene.stateMachine.enter(GameSceneResourceLoadingState.self)
    }
}
