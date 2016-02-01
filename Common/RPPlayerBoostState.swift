//
//  RPPlayerBoostState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 30.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPPlayerBoostState: RPPlayerState {

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
        self.entity.animationComponent.requestedAnimation = RPPlayerAnimationName.BoostingUp.rawValue
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
    }
    
    override func isValidNextState(stateClass: AnyClass) -> Bool {
        return true
    }
    
    override func willExitWithNextState(nextState: GKState) {
        super.willExitWithNextState(nextState)
    }
    
    override func contactWithEntityDidBegin(entity: GKEntity) {
        
    }
    
    override func contactWithEntityDidEnd(entity: GKEntity) {
        
    }
}
