//
//  RPPlatformNormalState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 02.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPPlatformNormalState: RPPlatformState {

    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        entity.animationComponent.requestedAnimation = RPPlatformAnimationName.Normal.rawValue
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
    }
    
    override func isValidNextState(stateClass: AnyClass) -> Bool {
        
        switch stateClass {
            
            case is RPPlatformNormalState.Type:
                return false
            
            default:
                return true
        }
    }
    
    override func willExitWithNextState(nextState: GKState) {
        
        super.willExitWithNextState(nextState)
    }
    
    override func contactWithEntityDidBegin(entity: GKEntity) {
        
        guard let renderComponent = entity.componentForClass(RPRenderComponent) else {
            fatalError("Collided node has no RenderComponent!")
        }
        
        let bottomCollision: Bool = (renderComponent.node.position.y < self.entity.renderComponent.node.position.y) ? true : false
        
        if bottomCollision && self.entity.bottomCollidable {
            
            if self.entity.breakable {
                
                self.entity.stateMachineComponent.stateMachine.enterState(RPPlatformBreakingState)
                
            } else {
                
                self.entity.stateMachineComponent.stateMachine.enterState(RPPlatformBottomHitState)
            }
            
        } else if (!bottomCollision) {
            
            if self.entity.breakable {
                
                self.entity.stateMachineComponent.stateMachine.enterState(RPPlatformBreakingState)
                
            } else {
                
                self.entity.stateMachineComponent.stateMachine.enterState(RPPlatformJumpingOnState)
            }
        }
    }
    
    override func contactWithEntityDidEnd(entity: GKEntity) {
        
        //self.entity.stateMachineComponent.stateMachine.enterState(RPDebugPlatformJumpingOffState)
    }
}
