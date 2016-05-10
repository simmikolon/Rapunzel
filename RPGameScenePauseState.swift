//
//  RPGameScenePauseState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 10.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPGameScenePauseState: RPGameSceneState {

    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        //gameScene.physicsWorld.speed = 0
        gameScene.paused = true
    }
}
