//
//  RPPlayerFallingState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 30.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPPlayerFallingState: RPPlayerState {

    // MARK: GKState Life Cycle
    
    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        
        if (previousState is RPPlayerJumpingState) || (previousState is RPPlayerBoostState) {
         
            RPColliderType.requestedContactNotifications[.PlayerBot] = [
                .TaskBot,
                .Obstacle
            ]
            
            RPColliderType.definedCollisions[.PlayerBot] = [
                .TaskBot,
                .Obstacle
            ]
            
            self.entity.physicsComponent.physicsBody.collisionBitMask = RPColliderType.PlayerBot.collisionMask
        }
        
        entity.animationComponent.requestedAnimation = RPPlayerAnimationName.FallingDown.rawValue
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
    }
    
    override func isValidNextState(stateClass: AnyClass) -> Bool {
        
        switch stateClass {
            
        case is RPPlayerBoostState.Type, is RPPlayerBouncingDownState.Type:
            return true
            
        default:
            return false
        }
    }
    
    override func willExitWithNextState(nextState: GKState) {
        super.willExitWithNextState(nextState)
    }
    
    override func contactWithEntityDidBegin(entity: GKEntity) {
        
        self.stateMachine?.enterState(RPPlayerBouncingDownState.self)
    }
}
