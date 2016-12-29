//
//  PlayerBouncingDownState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 30.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class PlayerBouncingDownState: PlayerState {

    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        entity.animationComponent.requestedAnimation = PlayerAnimationName.BounceDown.rawValue
    }
    
    override func update(deltaTime seconds: TimeInterval) {
        super.update(deltaTime: seconds)
        
        // Debug:
        
        if elapsedTime >= 0.01 {
            self.stateMachine?.enter(PlayerJumpingState.self)
        }
    }
    
    override func isValidNextState(_ stateClass: AnyClass) -> Bool {
        
        switch stateClass {
        case is PlayerBoostState.Type, is PlayerJumpingState.Type, is PlayerBottomCollisionState.Type:
            return true
        default:
            return false
        }
    }
}
