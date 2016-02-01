//
//  RPPlayerBouncingDownState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 30.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPPlayerBouncingDownState: RPPlayerState {

    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        
        let action = SKAction.scaleYTo(0.1, duration: 0.15)
        
        entity.animationComponent.node.runAction(action)
        entity.animationComponent.requestedAnimation = RPPlayerAnimationName.BounceDown.rawValue
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        
        // Debug:
        
        if elapsedTime >= 0.15 {
            self.stateMachine?.enterState(RPPlayerJumpingState.self)
        }
    }
    
    override func isValidNextState(stateClass: AnyClass) -> Bool {
        
        switch stateClass {
        case is RPPlayerBoostState.Type, is RPPlayerJumpingState.Type:
            return true
        default:
            return false
        }
    }
    
    override func willExitWithNextState(nextState: GKState) {
        super.willExitWithNextState(nextState)
    }
}
