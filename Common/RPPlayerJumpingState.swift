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
    
    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        self.entity.physicsComponent.physicsBody.collisionBitMask = ColliderType.PlayerBot.collisionMask
        self.entity.physicsComponent.physicsBody.velocity = CGVector(dx: self.entity.physicsComponent.physicsBody.velocity.dx,
                                                                     dy: 1550.0/*1650.0*/)
        entity.animationComponent.requestedAnimation = PlayerAnimationName.JumpUp.rawValue
    }
    
    override func isValidNextState(_ stateClass: AnyClass) -> Bool {
        
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
