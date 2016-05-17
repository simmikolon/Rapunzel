//
//  RPInputComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 26.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//


#if os(iOS)
    import UIKit
#else
    import Foundation
#endif

import GameplayKit

class RPInputComponent: GKComponent, RPInputSourceDelegate {
    
    var stateMachineComponent: RPStateMachineComponent {
        
        guard let stateMachineComponent = entity?.componentForClass(RPStateMachineComponent.self) else {
            fatalError()
        }
        
        return stateMachineComponent
    }
    
    var renderComponent: RPRenderComponent {
        
        guard let renderComponent = entity?.componentForClass(RPRenderComponent.self) else {
            fatalError()
        }
        
        return renderComponent
    }
    
    var physicsComponent: RPPhysicsComponent {
        
        guard let physicsComponent = entity?.componentForClass(RPGravityPhysicsComponent.self) else {
            fatalError()
        }
        
        return physicsComponent
    }
    
    var xAcceleration: CGFloat = 0.0
    var displacement: CGFloat = 0.0
    
    func inputSource(inputSource: RPInputSource, didUpdateDisplacement: float2) {
        
        self.displacement = CGFloat(didUpdateDisplacement.x)
    }
    
    func inputSourceDidBeginUsingSpecialPower(inputSource: RPInputSource) {
        
        self.stateMachineComponent.stateMachine.enterState(RPPlayerBoostState.self)
    }
    
    func inputSourceDidEndUsingSpecialPower(inputSource: RPInputSource) {}
    func inputSourceDidBeginAttack(inputSource: RPInputSource) {}
    func inputSourceDidEndAttack(inputSource: RPInputSource) {}
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        self.xAcceleration = (CGFloat(displacement) * 0.5) + (self.xAcceleration * 0.75)
        let xAcceleration = self.xAcceleration * RPInputHandlerSettings.AccelerationMultiplier
        physicsComponent.physicsBody.velocity = CGVector(dx: xAcceleration, dy: physicsComponent.physicsBody.velocity.dy)
    }
}
