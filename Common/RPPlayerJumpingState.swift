//
//  RPPlayerJumpingState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 30.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPPlayerJumpingState: RPPlayerState {
    
    // MARK: GKState Life Cycle
    
    override func didEnterWithPreviousState(previousState: GKState?) {
        
        super.didEnterWithPreviousState(previousState)

        self.entity.physicsComponent.physicsBody.collisionBitMask = RPColliderType.PlayerBot.collisionMask
        self.entity.physicsComponent.physicsBody.velocity = CGVectorMake(self.entity.physicsComponent.physicsBody.velocity.dx, 1500.0)

        entity.animationComponent.requestedAnimation = RPPlayerAnimationName.JumpUp.rawValue
    }
    
    override func isValidNextState(stateClass: AnyClass) -> Bool {
        
        if stateClass is RPPlayerBoostState.Type {
            return true
        }
        if stateClass is RPPlayerFallingState.Type {
            return true
        }
        if stateClass is RPPlayerBottomCollisionState.Type {
            return true
        }
        
        return false
    }
}
