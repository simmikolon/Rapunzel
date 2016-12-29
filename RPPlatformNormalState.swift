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

    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        entity.animationComponent.requestedAnimation = PlatformAnimationName.Normal.rawValue
    }
    
    override func update(deltaTime seconds: TimeInterval) {
        super.update(deltaTime: seconds)
    }
    
    override func isValidNextState(_ stateClass: AnyClass) -> Bool {
        
        switch stateClass {
            
            case is PlatformNormalState.Type:
                return false
            
            default:
                return true
        }
    }
    
    override func willExit(to nextState: GKState) {
        
        super.willExit(to: nextState)
    }
    
    override func contactWithEntityDidBegin(_ entity: GKEntity) {
        
        guard let renderComponent = entity.component(ofType: RenderComponent.self) else {
            fatalError("Collided node has no RenderComponent!")
        }
        
        let bottomCollision: Bool = (renderComponent.node.position.y < self.entity.renderComponent.node.position.y) ? true : false
        
        if bottomCollision && self.entity.bottomCollidable {
            
            if self.entity.breakable {
                
                self.entity.stateMachineComponent.stateMachine.enter(PlatformBreakingState.self)
                
            } else {
                
                self.entity.stateMachineComponent.stateMachine.enter(PlatformBottomHitState.self)
            }
            
        } else if (!bottomCollision) {
            
            if self.entity.breakable {
                
                self.entity.stateMachineComponent.stateMachine.enter(PlatformBreakingState.self)
                
            } else {
                
                self.entity.stateMachineComponent.stateMachine.enter(PlatformJumpingOnState.self)
            }
        }
    }
    
    override func contactWithEntityDidEnd(_ entity: GKEntity) {
        
        //self.entity.stateMachineComponent.stateMachine.enterState(DebugPlatformJumpingOffState)
    }
}
