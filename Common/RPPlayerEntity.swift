//
//  RPPlayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import UIKit
import SpriteKit
import GameplayKit

enum RPPlayerAnimationName: String {

    case BounceDown = "RPPlayerBounceDown"
    case BounceUp = "RPPlayerBounceUp"
    case FallingDown = "RPPlayerFallingDown"
    case JumpUp = "RPPlayerJumpUp"
    case Standing = "RPPlayerStanding"
    case BoostingUp = "RPPlayerBoostingUp"
    
    static let atlasNames = [
        
        Standing.rawValue,
        BounceDown.rawValue,
        BounceUp.rawValue,
        FallingDown.rawValue,
        JumpUp.rawValue,
        BoostingUp.rawValue
        
    ]
}

class RPPlayerEntity: GKEntity, ContactNotifiableType, RPResourceLoadableType, RPInputComponentDelegate {
    
    static var textureSize = CGSize(width: 32, height: 32)
    static var animations: [String: RPAnimation]!
    
    // MARK: Components
    
    let renderComponent: RPRenderComponent
    let physicsComponent: RPGravityPhysicsComponent
    let inputComponent: RPInputComponent
    var stateMachineComponent: RPStateMachineComponent!
    let animationComponent: RPAnimationComponent
    
    // MARK: Initialisation
    
    override init() {
        
        physicsComponent = RPGravityPhysicsComponent(physicsBody: SKPhysicsBody(rectangleOfSize: CGSize(width: 32, height: 32)), colliderType: .PlayerBot)
        renderComponent = RPRenderComponent()
        inputComponent = RPInputComponent()
        
        guard let animations = RPPlayerEntity.animations else { fatalError() }
        
        animationComponent = RPAnimationComponent(textureSize: RPPlayerEntity.textureSize, animations: animations)
        animationComponent.requestedAnimation = RPPlayerAnimationName.Standing.rawValue
        
        renderComponent.addChild(animationComponent.node)
        
        super.init()
        
        renderComponent.node.entity = self;
        
        stateMachineComponent = RPStateMachineComponent(states: [
            
            RPPlayerStandingState(entity: self),
            RPPlayerFallingState(entity: self),
            RPPlayerBouncingDownState(entity: self),
            RPPlayerBouncingUpState(entity: self),
            RPPlayerJumpingState(entity: self),
            RPPlayerBoostState(entity: self)
            
            ])
        
        stateMachineComponent.enterInitialState()
        
        renderComponent.node.entity = self;
        renderComponent.node.physicsBody = physicsComponent.physicsBody
        
        inputComponent.delegate = self;

        addComponent(physicsComponent)
        addComponent(renderComponent)
        addComponent(inputComponent)
        addComponent(stateMachineComponent)
        addComponent(animationComponent)
    }
    
    // MARK: Input Component Delegate Methods
    
    func didTap() {
        
        self.stateMachineComponent.stateMachine.enterState(RPPlayerBoostState.self)
    }
    
    func didChangeMotion(xAcceleration: CGFloat) {

        physicsComponent.physicsBody.velocity = CGVector(dx: xAcceleration, dy: physicsComponent.physicsBody.velocity.dy)
    }
}

extension RPPlayerEntity {
    
    func contactWithEntityDidBegin(entity: GKEntity) {
        
        self.stateMachineComponent.contactWithEntityDidBegin(entity)
    }
    
    func contactWithEntityDidEnd(entity: GKEntity) {
        
        self.stateMachineComponent.contactWithEntityDidEnd(entity)
    }
}

extension RPPlayerEntity {
    
    static var resourcesNeedLoading: Bool {
        return true
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        SKTextureAtlas.preloadTextureAtlasesNamed(RPPlayerAnimationName.atlasNames) { error, atlases in
            
            if let error = error { fatalError("Fatal Error beim Preloading der TextureAtlases: \(error)") }
            
            animations = [:]
            
            for var i = 0; i < atlases.count; ++i {
                
                animations[RPPlayerAnimationName.atlasNames[i]] = RPAnimationComponent.animationsFromAtlas(atlases[i], animationName: RPPlayerAnimationName.atlasNames[i])
            }
            
            completionHandler()
        }
    }
    
    static func purgeResources() {

        animations = nil
    }
    
}
