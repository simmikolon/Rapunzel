//
//  RPHairLayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

/* ------ Prototyping ------ */

enum RPRibbonPlatformPosition: CGFloat {
    
    case Left = -15
    case Right = 15
}

/**/

class RPHairLayerEntity: RPLayerEntity, RPResourceLoadableType {
    
    static var tileSize = CGSize(width: 1364, height: 192)
    static var atlas: SKTextureAtlas!
    static var tileSet: RPTileSet!
    
    // MARK: Components
    
    var tileComponent: RPTileComponent!
    
    // MARK: Initialisation
    
    override init(withParallaxFactor factor: CGFloat = 1.0, cameraComponent: RPCameraComponent, zPosition: CGFloat = 0.0) {
        
        /* ---- PROTOTYPING ---- */
        
        self.platformEntities = []
        
        /* ---- PROTOTYPING ---- */
        
        super.init(withParallaxFactor: factor, cameraComponent: cameraComponent, zPosition: zPosition)
        
        self.tileComponent = RPTileComponent(withEntity: self, tileSet: RPHairLayerEntity.tileSet, offset: 250.0)
        
        addComponent(self.tileComponent)
        
        self.name = "RPHairLayerEntity"
        
        /* ----------------------------- PROTOTYPING ------------------------------ */
        
        var numberOfInitialPlatforms = 0
        
        while verticalOffset < RPGameSceneSettings.height + 400 {
            
            let platform: RPPlatformEntity
            
            switch horizontalOffset {
            case .Right:
                platform = RPHairRibbonPlatformEntity(isBreakable: false, isBottomCollidable: false)
                break
            default:
                platform = RPHairRibbonPlatformEntity(isBreakable: false, isBottomCollidable: false)
                break
            }
            
            platform.renderComponent.node.position = CGPoint(x: horizontalOffset.rawValue, y: verticalOffset)
            platform.renderComponent.node.zPosition = 1
            
            self.platformEntities.append(platform)
            self.renderComponent.addChild(platform.renderComponent.node)
            
            nextPlatform()
            
            numberOfInitialPlatforms += 1
        }
        
        /* ----------------------------- PROTOTYPING ------------------------------ */
    }
    
    
    // ------ PROTOTYPING ------------------------------------------------------

    let minimumDistanceBetweenPlatforms: CGFloat = 790 //180
    let maximumDistanceBetweenPlatforms: CGFloat = 800 //250
    
    var verticalOffset: CGFloat = 500
    var horizontalOffset: RPRibbonPlatformPosition = .Left
    
    var platformEntities: [RPPlatformEntity]
    
    func nextPlatform() {
        
        let verticalOffsetDistribution = GKShuffledDistribution(lowestValue: Int(minimumDistanceBetweenPlatforms), highestValue: Int(maximumDistanceBetweenPlatforms))
        verticalOffset += CGFloat(verticalOffsetDistribution.nextInt())
        
        
        
        /* Wird anders gemacht: */
        if horizontalOffset == .Left { horizontalOffset = .Right }
        else { horizontalOffset = .Left }
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        
        super.updateWithDeltaTime(seconds)
        
        self.tileComponent.updateWithDeltaTime(seconds)
        
        for platformEntity: RPPlatformEntity in self.platformEntities {
            
            platformEntity.updateWithDeltaTime(seconds)
            
            let platformAbsolutePosition = RPGameScene.sharedGameScene.convertPoint(platformEntity.renderComponent.node.position, fromNode: self.renderComponent.node)
            
            if platformAbsolutePosition.y < -132 {
                
                platformEntity.renderComponent.node.position.y = verticalOffset
                
                nextPlatform()
            }
        }
    }
    
    // ------------------------------------------------------------------------
}

extension RPHairLayerEntity {
    
    static var resourcesNeedLoading: Bool {
        return true
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        atlas = SKTextureAtlas(named: "RPHairLayer")
        atlas.preloadWithCompletionHandler { () -> Void in
            
            tileSet = RPTileComponent.tileSetFromAtlas(atlas)
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        atlas = nil
    }
}