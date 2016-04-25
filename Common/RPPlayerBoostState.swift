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
        
        self.entity.physicsComponent.physicsBody.collisionBitMask = RPColliderType.PlayerBot.collisionMask
        self.entity.physicsComponent.physicsBody.applyImpulse(CGVector(dx: 0, dy: 500))
        self.entity.animationComponent.requestedAnimation = RPPlayerAnimationName.BoostingUp.rawValue
    }
    
    override func isValidNextState(stateClass: AnyClass) -> Bool {
        return true
    }
}
