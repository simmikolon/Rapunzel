//
//  RPPlatformBreakingState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 02.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

class RPPlatformBreakingState: RPPlatformState {

    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        let action = SKAction.fadeOutWithDuration(0.5)
        entity.renderComponent.node.runAction(action)
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        
        if elapsedTime > 0.5 {
            
            self.entity.remove()
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
