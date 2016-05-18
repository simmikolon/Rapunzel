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
    
    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        if (previousState is PlayerJumpingState) || (previousState is PlayerBoostState) {
            self.entity.physicsComponent.physicsBody.collisionBitMask = ColliderType.PlayerBot.collisionMask
        }
        entity.animationComponent.requestedAnimation = PlayerAnimationName.FallingDown.rawValue
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        limitSpeedFallingDown()
    }
    
    func limitSpeedFallingDown() {
        if entity.physicsComponent.physicsBody.velocity.dy <= -2000 {
            entity.physicsComponent.physicsBody.velocity.dy = -2000
        }
    }
    
    override func isValidNextState(stateClass: AnyClass) -> Bool {
        switch stateClass {
        case is PlayerBoostState.Type, is PlayerBouncingDownState.Type, is PlayerBottomCollisionState.Type:
            return true
        default:
            return false
        }
    }
}
