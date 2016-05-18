//
//  PlayerJumpingState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 30.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class PlayerJumpingState: PlayerState {
    
    // MARK: GKState Life Cycle
    
    override func didEnterWithPreviousState(previousState: GKState?) {
        
        super.didEnterWithPreviousState(previousState)

        self.entity.physicsComponent.physicsBody.collisionBitMask = ColliderType.PlayerBot.collisionMask
        self.entity.physicsComponent.physicsBody.velocity = CGVectorMake(self.entity.physicsComponent.physicsBody.velocity.dx, 1750.0)

        entity.animationComponent.requestedAnimation = PlayerAnimationName.JumpUp.rawValue
    }
    
    override func isValidNextState(stateClass: AnyClass) -> Bool {
        
        if stateClass is PlayerBoostState.Type {
            return true
        }
        if stateClass is PlayerFallingState.Type {
            return true
        }
        if stateClass is PlayerBottomCollisionState.Type {
            return true
        }
        
        return false
    }
}
