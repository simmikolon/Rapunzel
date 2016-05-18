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

    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        entity.animationComponent.requestedAnimation = PlayerAnimationName.BounceDown.rawValue
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        
        // Debug:
        
        if elapsedTime >= 0.01 {
            self.stateMachine?.enterState(PlayerJumpingState.self)
        }
    }
    
    override func isValidNextState(stateClass: AnyClass) -> Bool {
        
        switch stateClass {
        case is PlayerBoostState.Type, is PlayerJumpingState.Type, is PlayerBottomCollisionState.Type:
            return true
        default:
            return false
        }
    }
}
