//
//  GameScenePlayingState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 10.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class GameScenePlayingState: GameSceneState {

    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
    }
    
    override func update(deltaTime seconds: TimeInterval) {
        super.update(deltaTime: seconds)
        gameScene.patternManager.update()
        gameScene.entityManager.updateComponentSystems(withCurrentTime: seconds)
        gameScene.entityManager.flushEntities()
    }
}
