//
//  PlayerBottomCollisionState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 03.03.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class PlayerBottomCollisionState: PlayerState {

    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        entity.animationComponent.requestedAnimation = PlayerAnimationName.BounceDown.rawValue
        self.entity.physicsComponent.physicsBody.velocity = CGVector(dx: 0, dy: 0)
        self.entity.animationComponent.node.run(SKAction.colorize(with: SKColor.red, colorBlendFactor: 1.0, duration: 0.15), completion: { () -> Void in
            self.entity.animationComponent.node.run(SKAction.colorize(with: SKColor.white, colorBlendFactor: 0, duration: 0.15))
        }) 
    }
    
    override func update(deltaTime seconds: TimeInterval) {
        super.update(deltaTime: seconds)
    }
    
    override func isValidNextState(_ stateClass: AnyClass) -> Bool {
        
        switch stateClass {
        case is PlayerBoostState.Type, is PlayerFallingState.Type, is PlayerBottomCollisionState.Type:
            return true
        default:
            return false
        }
    }
}
