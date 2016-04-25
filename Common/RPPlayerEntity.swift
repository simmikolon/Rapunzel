//
//  RPPlayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

//import UIKit
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

class RPPlayerEntity: GKEntity, ContactNotifiableType, RPResourceLoadableType, RPInputComponentDelegate, RPPlayerStateDelegate {
    
    static var textureSize = CGSize(width: 104, height: 232)
    static var animations: [String: RPAnimation]!
    
    weak var playerStateDelegate: RPPlayerStateDelegate?
    
    // MARK: Components
    
    let renderComponent: RPRenderComponent
    let physicsComponent: RPGravityPhysicsComponent
    let inputComponent: RPInputComponent
    var stateMachineComponent: RPStateMachineComponent!
    let animationComponent: RPAnimationComponent
    
    // MARK: Initialisation
    
    override init() {
        
        /* Component Initialisation before super.init() */
        
        physicsComponent = RPGravityPhysicsComponent(physicsBody: SKPhysicsBody(rectangleOfSize: CGSize(width: 30, height: 232)), colliderType: .PlayerBot)
        renderComponent = RPRenderComponent()
        inputComponent = RPInputComponent()
        
        /* Animation Component */
        
        guard let animations = RPPlayerEntity.animations else { fatalError() }
        
        animationComponent = RPAnimationComponent(textureSize: RPPlayerEntity.textureSize, animations: animations)
        animationComponent.requestedAnimation = RPPlayerAnimationName.Standing.rawValue
        
        renderComponent.addChild(animationComponent.node)
        
        super.init()
        
        /* State Machine */
        
        stateMachineComponent = RPStateMachineComponent(states: [
            
            RPPlayerStandingState(entity: self, delegate: self),
            RPPlayerFallingState(entity: self, delegate: self),
            RPPlayerBouncingDownState(entity: self, delegate: self),
            RPPlayerBouncingUpState(entity: self, delegate: self),
            RPPlayerJumpingState(entity: self, delegate: self),
            RPPlayerBoostState(entity: self, delegate: self),
            RPPlayerBottomCollisionState(entity: self, delegate: self)
            
            ])
        
        stateMachineComponent.enterInitialState()
        
        /* Render Component Setup after super.init() */
        
        renderComponent.node.entity = self
        renderComponent.node.entity = self
        renderComponent.node.physicsBody = physicsComponent.physicsBody
        
        /* Input Component */
        
        inputComponent.delegate = self;

        addComponent(physicsComponent)
        addComponent(renderComponent)
        addComponent(inputComponent)
        addComponent(stateMachineComponent)
        addComponent(animationComponent)
    }
    
    // MARK: Input Component Delegate Methods
    // TODO: Out-Sourcing input Methods as States and implement State Machine into InputComponent!
    
    func didTap() {
        
        self.stateMachineComponent.stateMachine.enterState(RPPlayerBoostState.self)
    }
    
    func didChangeMotion(xAcceleration: CGFloat) {

        physicsComponent.physicsBody.velocity = CGVector(dx: xAcceleration, dy: physicsComponent.physicsBody.velocity.dy)
    }
    
    /**/
    
    var isKeyRightDown = false
    var isKeyLeftDown = false
    
    func keyRightDown() {
        
        isKeyRightDown = true
        isKeyLeftDown = false
    }
    
    func keyRightUp() {
        
        isKeyRightDown = false
    }
    
    func keyLeftDown() {
        
        isKeyLeftDown = true
        isKeyRightDown = false
    }
    
    func keyLeftUp() {
        
        isKeyLeftDown = false
    }
    
    // MARK: Player State Delegate
    
    func playerDidFallDown() {
        
        guard let playerStateDelegate = self.playerStateDelegate else {
            fatalError("Player Needs Delegate!")
        }
        
        playerStateDelegate.playerDidFallDown()
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
                
                animations[RPPlayerAnimationName.atlasNames[i]] = RPAnimationComponent.animationsFromAtlas(atlases[i])
            }
            
            completionHandler()
        }
    }
    
    static func purgeResources() {

        animations = nil
    }
    
}
