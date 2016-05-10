//
//  RPGameSceneDidMoveToViewState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 10.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

class RPGameSceneDidMoveToViewState: RPGameSceneState {

    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        setupScene()
    }
    
    func setupScene() {
        
        gameScene.physicsWorld.contactDelegate = gameScene.contactDelegate
        gameScene.backgroundColor = SKColor(red: 30/255, green: 60/255, blue: 63/255, alpha: 1)
        gameScene.anchorPoint = CGPoint(x: 0.5, y: 0)
        gameScene.stateMachine.enterState(RPGameSceneResourceLoadingState.self)
    }
}
