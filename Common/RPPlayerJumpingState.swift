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

        RPColliderType.requestedContactNotifications[.PlayerBot] = [
            .TaskBot,
        ]
        
        RPColliderType.definedCollisions[.PlayerBot] = [
            .TaskBot
        ]
        
        self.entity.physicsComponent.physicsBody.collisionBitMask = RPColliderType.PlayerBot.collisionMask
        self.entity.physicsComponent.physicsBody.velocity = CGVectorMake(self.entity.physicsComponent.physicsBody.velocity.dx, 1000.0)
        
        let action = SKAction.scaleYTo(1.0, duration: 0.15)
        
        entity.animationComponent.node.runAction(action)
        entity.animationComponent.requestedAnimation = RPPlayerAnimationName.JumpUp.rawValue
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
    }
    
    override func isValidNextState(stateClass: AnyClass) -> Bool {
        if stateClass is RPPlayerBoostState.Type {
            return true
        }
        if stateClass is RPPlayerFallingState.Type {
            return true
        }
        
        return false
    }
    
    override func willExitWithNextState(nextState: GKState) {
        super.willExitWithNextState(nextState)
    }
    
    override func contactWithEntityDidBegin(entity: GKEntity) {
        
    }
    
    override func contactWithEntityDidEnd(entity: GKEntity) {
        
    }
}
