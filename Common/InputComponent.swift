//
//  InputComponent.swift
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

struct InputComponentSettings {
    
    static let AccelerationMultiplier: CGFloat = 1000.0
}

class InputComponent: GKComponent, InputSourceDelegate {
    
    var stateMachineComponent: StateMachineComponent {
        
        guard let stateMachineComponent = entity?.componentForClass(StateMachineComponent.self) else {
            fatalError()
        }
        
        return stateMachineComponent
    }
    
    var renderComponent: RenderComponent {
        
        guard let renderComponent = entity?.componentForClass(RenderComponent.self) else {
            fatalError()
        }
        
        return renderComponent
    }
    
    var physicsComponent: PhysicsComponent {
        
        guard let physicsComponent = entity?.componentForClass(GravityPhysicsComponent.self) else {
            fatalError()
        }
        
        return physicsComponent
    }
    
    var xAcceleration: CGFloat = 0.0
    var displacement: CGFloat = 0.0
    
    func inputSource(inputSource: InputSource, didUpdateDisplacement: float2) {
        
        self.displacement = CGFloat(didUpdateDisplacement.x)
    }
    
    func inputSourceDidBeginUsingSpecialPower(inputSource: InputSource) {
        
        self.stateMachineComponent.stateMachine.enterState(PlayerBoostState.self)
    }
    
    func inputSourceDidEndUsingSpecialPower(inputSource: InputSource) {}
    func inputSourceDidBeginAttack(inputSource: InputSource) {}
    func inputSourceDidEndAttack(inputSource: InputSource) {}
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        self.xAcceleration = (CGFloat(displacement) * 0.5) + (self.xAcceleration * 0.75)
        let xAcceleration = self.xAcceleration * InputComponentSettings.AccelerationMultiplier
        physicsComponent.physicsBody.velocity = CGVector(dx: xAcceleration, dy: physicsComponent.physicsBody.velocity.dy)
    }
}
