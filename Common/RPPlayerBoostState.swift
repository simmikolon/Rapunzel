//
//  PlayerBoostState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 30.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class PlayerBoostState: PlayerState {

    override func didEnter(from previousState: GKState?) {
        
        super.didEnter(from: previousState)
        
        self.entity.physicsComponent.physicsBody.collisionBitMask = ColliderType.PlayerBot.collisionMask
        self.entity.physicsComponent.physicsBody.applyImpulse(CGVector(dx: 0, dy: 500))
        self.entity.animationComponent.requestedAnimation = PlayerAnimationName.BoostingUp.rawValue
    }
    
    override func isValidNextState(_ stateClass: AnyClass) -> Bool {
        return true
    }
}
