//
//  PlatformBottomHitState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 02.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

class PlatformBottomHitState: PlatformState {

    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        self.entity.animationComponent.requestedAnimation = PlatformAnimationName.BottomHit.rawValue
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        
        if elapsedTime >= 0.25 {
            
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
        
    }
    
    override func contactWithEntityDidEnd(entity: GKEntity) {
        
    }
}
