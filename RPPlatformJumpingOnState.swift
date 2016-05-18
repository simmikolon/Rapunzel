//
//  PlatformJumpingOnState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 02.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class PlatformJumpingOnState: PlatformState {

    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        entity.animationComponent.requestedAnimation = PlatformAnimationName.JumpingOn.rawValue
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        
        if elapsedTime >= 0.15 {
            
            entity.stateMachineComponent.stateMachine.enterState(PlatformNormalState)
        }
    }
    
    override func isValidNextState(stateClass: AnyClass) -> Bool {
        return true
    }
    
    override func willExitWithNextState(nextState: GKState) {
        super.willExitWithNextState(nextState)
    }
    
    override func contactWithEntityDidBegin(entity: GKEntity) {
        
        self.entity.stateMachineComponent.stateMachine.enterState(PlatformJumpingOnState)
    }
    
    override func contactWithEntityDidEnd(entity: GKEntity) {
        
        //self.entity.stateMachineComponent.stateMachine.enterState(DebugPlatformJumpingOffState)
    }
}
