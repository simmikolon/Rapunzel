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

    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        entity.animationComponent.requestedAnimation = PlayerAnimationName.BounceDown.rawValue
        self.entity.physicsComponent.physicsBody.velocity = CGVector(dx: 0, dy: 0)
        self.entity.animationComponent.node.runAction(SKAction.colorizeWithColor(SKColor.redColor(), colorBlendFactor: 1.0, duration: 0.15)) { () -> Void in
            self.entity.animationComponent.node.runAction(SKAction.colorizeWithColor(SKColor.whiteColor(), colorBlendFactor: 0, duration: 0.15))
        }
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
    }
    
    override func isValidNextState(stateClass: AnyClass) -> Bool {
        
        switch stateClass {
        case is PlayerBoostState.Type, is PlayerFallingState.Type, is PlayerBottomCollisionState.Type:
            return true
        default:
            return false
        }
    }
}
