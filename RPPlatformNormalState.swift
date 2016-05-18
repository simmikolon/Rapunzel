//
//  PlatformNormalState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 02.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class PlatformNormalState: PlatformState {

    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        entity.animationComponent.requestedAnimation = PlatformAnimationName.Normal.rawValue
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
    }
    
    override func isValidNextState(stateClass: AnyClass) -> Bool {
        
        switch stateClass {
            
            case is PlatformNormalState.Type:
                return false
            
            default:
                return true
        }
    }
    
    override func willExitWithNextState(nextState: GKState) {
        
        super.willExitWithNextState(nextState)
    }
    
    override func contactWithEntityDidBegin(entity: GKEntity) {
        
        guard let renderComponent = entity.componentForClass(RenderComponent) else {
            fatalError("Collided node has no RenderComponent!")
        }
        
        let bottomCollision: Bool = (renderComponent.node.position.y < self.entity.renderComponent.node.position.y) ? true : false
        
        if bottomCollision && self.entity.bottomCollidable {
            
            if self.entity.breakable {
                
                self.entity.stateMachineComponent.stateMachine.enterState(PlatformBreakingState)
                
            } else {
                
                self.entity.stateMachineComponent.stateMachine.enterState(PlatformBottomHitState)
            }
            
        } else if (!bottomCollision) {
            
            if self.entity.breakable {
                
                self.entity.stateMachineComponent.stateMachine.enterState(PlatformBreakingState)
                
            } else {
                
                self.entity.stateMachineComponent.stateMachine.enterState(PlatformJumpingOnState)
            }
        }
    }
    
    override func contactWithEntityDidEnd(entity: GKEntity) {
        
        //self.entity.stateMachineComponent.stateMachine.enterState(DebugPlatformJumpingOffState)
    }
}
