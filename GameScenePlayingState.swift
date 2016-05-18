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

    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        gameScene.patternManager.update()
        gameScene.entityManager.updateComponentSystems(withCurrentTime: seconds)
        gameScene.entityManager.flushEntities()
    }
}
