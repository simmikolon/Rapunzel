//
//  PlayerFallingState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 30.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class PlayerFallingState: PlayerState {

    // MARK: GKState Life Cycle
    
    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        if (previousState is PlayerJumpingState) || (previousState is PlayerBoostState) {
            self.entity.physicsComponent.physicsBody.collisionBitMask = ColliderType.PlayerBot.collisionMask
        }
        entity.animationComponent.requestedAnimation = PlayerAnimationName.FallingDown.rawValue
    }
    
    override func update(deltaTime seconds: TimeInterval) {
        super.update(deltaTime: seconds)
        limitSpeedFallingDown()
    }
    
    func limitSpeedFallingDown() {
        if entity.physicsComponent.physicsBody.velocity.dy <= -2000 {
            entity.physicsComponent.physicsBody.velocity.dy = -2000
        }
    }
    
    override func isValidNextState(_ stateClass: AnyClass) -> Bool {
        switch stateClass {
        case is PlayerBoostState.Type, is PlayerBouncingDownState.Type, is PlayerBottomCollisionState.Type:
            return true
        default:
            return false
        }
    }
}
